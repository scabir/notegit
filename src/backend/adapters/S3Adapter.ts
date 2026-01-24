import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetBucketVersioningCommand,
  ListObjectVersionsCommand,
} from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import type { S3RepoSettings } from '../../shared/types';
import { ApiError, ApiErrorCode } from '../../shared/types';
import { logger } from '../utils/logger';

export interface S3ObjectSummary {
  key: string;
  lastModified?: Date;
  size?: number;
  eTag?: string;
}

export interface S3ObjectVersion {
  versionId: string;
  lastModified?: Date;
  isLatest: boolean;
  eTag?: string;
}

export class S3Adapter {
  private client: S3Client | null = null;
  private settings: S3RepoSettings | null = null;

  configure(settings: S3RepoSettings): void {
    this.settings = settings;
    this.client = new S3Client({
      region: settings.region,
      credentials: {
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey,
        sessionToken: settings.sessionToken || undefined,
      },
    });
  }

  async getBucketVersioning(): Promise<'Enabled' | 'Suspended' | ''> {
    const client = this.ensureClient();
    const bucket = this.ensureBucket();

    try {
      const response = await client.send(new GetBucketVersioningCommand({ Bucket: bucket }));
      return response.Status || '';
    } catch (error: any) {
      logger.error('Failed to get S3 bucket versioning', { bucket, error });
      throw this.createError(
        this.isAuthError(error) ? ApiErrorCode.S3_AUTH_FAILED : ApiErrorCode.S3_SYNC_FAILED,
        `Failed to get bucket versioning: ${error.message || 'Unknown error'}`,
        error
      );
    }
  }

  async listObjects(prefix: string): Promise<S3ObjectSummary[]> {
    const client = this.ensureClient();
    const bucket = this.ensureBucket();
    const results: S3ObjectSummary[] = [];
    let continuationToken: string | undefined;

    try {
      do {
        const response = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix || undefined,
            ContinuationToken: continuationToken,
          })
        );

        for (const item of response.Contents || []) {
          if (!item.Key) {
            continue;
          }
          results.push({
            key: item.Key,
            lastModified: item.LastModified,
            size: item.Size,
            eTag: item.ETag,
          });
        }

        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
      } while (continuationToken);

      return results;
    } catch (error: any) {
      logger.error('Failed to list S3 objects', { bucket, prefix, error });
      throw this.createError(
        this.isAuthError(error) ? ApiErrorCode.S3_AUTH_FAILED : ApiErrorCode.S3_SYNC_FAILED,
        `Failed to list objects: ${error.message || 'Unknown error'}`,
        error
      );
    }
  }

  async listObjectVersions(prefix: string): Promise<S3ObjectVersion[]> {
    const client = this.ensureClient();
    const bucket = this.ensureBucket();
    const results: S3ObjectVersion[] = [];
    let keyMarker: string | undefined;
    let versionMarker: string | undefined;

    try {
      do {
        const response = await client.send(
          new ListObjectVersionsCommand({
            Bucket: bucket,
            Prefix: prefix || undefined,
            KeyMarker: keyMarker,
            VersionIdMarker: versionMarker,
          })
        );

        for (const version of response.Versions || []) {
          if (!version.Key || !version.VersionId) {
            continue;
          }
          if (prefix && version.Key !== prefix) {
            continue;
          }
          results.push({
            versionId: version.VersionId,
            lastModified: version.LastModified,
            isLatest: Boolean(version.IsLatest),
            eTag: version.ETag,
          });
        }

        keyMarker = response.IsTruncated ? response.NextKeyMarker : undefined;
        versionMarker = response.IsTruncated ? response.NextVersionIdMarker : undefined;
      } while (keyMarker);

      return results;
    } catch (error: any) {
      logger.error('Failed to list S3 object versions', { bucket, prefix, error });
      throw this.createError(
        this.isAuthError(error) ? ApiErrorCode.S3_AUTH_FAILED : ApiErrorCode.S3_SYNC_FAILED,
        `Failed to list object versions: ${error.message || 'Unknown error'}`,
        error
      );
    }
  }

  async getObject(key: string, versionId?: string): Promise<Buffer> {
    const client = this.ensureClient();
    const bucket = this.ensureBucket();

    try {
      const response = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          VersionId: versionId || undefined,
        })
      );

      if (!response.Body) {
        return Buffer.from('');
      }

      const body = response.Body as Readable | Buffer | Uint8Array;
      if (Buffer.isBuffer(body)) {
        return body;
      }

      if (body instanceof Uint8Array) {
        return Buffer.from(body);
      }

      return await this.streamToBuffer(body as Readable);
    } catch (error: any) {
      logger.error('Failed to get S3 object', { bucket, key, versionId, error });
      throw this.createError(
        this.isAuthError(error) ? ApiErrorCode.S3_AUTH_FAILED : ApiErrorCode.S3_SYNC_FAILED,
        `Failed to get object: ${error.message || 'Unknown error'}`,
        error
      );
    }
  }

  async putObject(key: string, body: Buffer | Uint8Array | Readable, contentType?: string): Promise<void> {
    const client = this.ensureClient();
    const bucket = this.ensureBucket();

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType || undefined,
        })
      );
    } catch (error: any) {
      logger.error('Failed to put S3 object', { bucket, key, error });
      throw this.createError(
        this.isAuthError(error) ? ApiErrorCode.S3_AUTH_FAILED : ApiErrorCode.S3_SYNC_FAILED,
        `Failed to upload object: ${error.message || 'Unknown error'}`,
        error
      );
    }
  }

  async headObject(key: string): Promise<S3ObjectSummary> {
    const client = this.ensureClient();
    const bucket = this.ensureBucket();

    try {
      const response = await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      return {
        key,
        lastModified: response.LastModified,
        size: response.ContentLength,
        eTag: response.ETag,
      };
    } catch (error: any) {
      logger.error('Failed to head S3 object', { bucket, key, error });
      throw this.createError(
        this.isAuthError(error) ? ApiErrorCode.S3_AUTH_FAILED : ApiErrorCode.S3_SYNC_FAILED,
        `Failed to read object metadata: ${error.message || 'Unknown error'}`,
        error
      );
    }
  }

  async deleteObject(key: string): Promise<void> {
    const client = this.ensureClient();
    const bucket = this.ensureBucket();

    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
    } catch (error: any) {
      logger.error('Failed to delete S3 object', { bucket, key, error });
      throw this.createError(
        this.isAuthError(error) ? ApiErrorCode.S3_AUTH_FAILED : ApiErrorCode.S3_SYNC_FAILED,
        `Failed to delete object: ${error.message || 'Unknown error'}`,
        error
      );
    }
  }

  private ensureClient(): S3Client {
    if (!this.client || !this.settings) {
      throw this.createError(
        ApiErrorCode.S3_SYNC_FAILED,
        'S3 adapter is not configured',
        null
      );
    }
    return this.client;
  }

  private ensureBucket(): string {
    if (!this.settings?.bucket) {
      throw this.createError(ApiErrorCode.S3_SYNC_FAILED, 'S3 bucket is not configured', null);
    }
    return this.settings.bucket;
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return await new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  private isAuthError(error: any): boolean {
    return (
      error?.name === 'CredentialsProviderError' ||
      error?.name === 'AccessDenied' ||
      error?.Code === 'AccessDenied' ||
      error?.$metadata?.httpStatusCode === 403
    );
  }

  private createError(code: ApiErrorCode, message: string, details?: any): ApiError {
    return {
      code,
      message,
      details,
    };
  }
}
