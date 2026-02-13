import * as crypto from "crypto";
import type { Readable } from "stream";
import { S3Adapter, S3ObjectSummary, S3ObjectVersion } from "./S3Adapter";
import { ApiError, ApiErrorCode, S3RepoSettings } from "../../shared/types";

type MockVersion = {
  versionId: string;
  lastModified: Date;
  eTag?: string;
  body: Buffer | null;
};

type BucketStore = Map<string, MockVersion[]>;

const DEFAULT_VERSIONING_STATUS = "Enabled";

export class MockS3Adapter extends S3Adapter {
  private mockSettings: S3RepoSettings | null = null;
  private readonly buckets = new Map<string, BucketStore>();

  configure(settings: S3RepoSettings): void {
    this.mockSettings = settings;
    const bucket = settings.bucket || "";
    if (!this.buckets.has(bucket)) {
      this.buckets.set(bucket, new Map());
    }
  }

  async getBucketVersioning(): Promise<"Enabled" | "Suspended" | ""> {
    const status =
      process.env.NOTEGIT_MOCK_S3_VERSIONING_STATUS ||
      DEFAULT_VERSIONING_STATUS;
    if (status === "Enabled" || status === "Suspended" || status === "") {
      return status;
    }
    return DEFAULT_VERSIONING_STATUS;
  }

  async listObjects(prefix: string): Promise<S3ObjectSummary[]> {
    const store = this.ensureBucketStore();
    const objects: S3ObjectSummary[] = [];

    for (const [key, versions] of store.entries()) {
      if (prefix && !key.startsWith(prefix)) {
        continue;
      }

      const latest = this.getLatestLiveVersion(versions);
      if (!latest || !latest.body) {
        continue;
      }

      objects.push({
        key,
        lastModified: latest.lastModified,
        size: latest.body.length,
        eTag: latest.eTag,
      });
    }

    return objects.sort((a, b) => a.key.localeCompare(b.key));
  }

  async listObjectVersions(prefix: string): Promise<S3ObjectVersion[]> {
    const store = this.ensureBucketStore();
    const versions: S3ObjectVersion[] = [];

    for (const [key, keyVersions] of store.entries()) {
      if (prefix && !key.startsWith(prefix)) {
        continue;
      }

      const latestLive = this.getLatestLiveVersion(keyVersions);
      const latestLiveVersionId = latestLive?.versionId;

      for (const entry of keyVersions) {
        if (!entry.body) {
          continue;
        }
        versions.push({
          versionId: entry.versionId,
          lastModified: entry.lastModified,
          isLatest: entry.versionId === latestLiveVersionId,
          eTag: entry.eTag,
        });
      }
    }

    return versions;
  }

  async getObject(key: string, versionId?: string): Promise<Buffer> {
    const versions = this.ensureObjectVersions(key);
    if (versionId) {
      const match = versions.find((entry) => entry.versionId === versionId);
      if (!match || !match.body) {
        throw this.createMockError(
          ApiErrorCode.S3_SYNC_FAILED,
          `Object version not found: ${key}@${versionId}`,
          null,
        );
      }
      return Buffer.from(match.body);
    }

    const latest = this.getLatestLiveVersion(versions);
    if (!latest?.body) {
      throw this.createMockError(
        ApiErrorCode.S3_SYNC_FAILED,
        `Object not found: ${key}`,
        null,
      );
    }

    return Buffer.from(latest.body);
  }

  async putObject(
    key: string,
    body: Buffer | Uint8Array | Readable,
    _contentType?: string,
  ): Promise<void> {
    const store = this.ensureBucketStore();
    const payload = await this.toBuffer(body);
    const hash = crypto.createHash("md5").update(payload).digest("hex");

    const versions = store.get(key) || [];
    versions.push({
      versionId: this.createVersionId(),
      lastModified: new Date(),
      eTag: `"${hash}"`,
      body: payload,
    });
    store.set(key, versions);
  }

  async headObject(key: string): Promise<S3ObjectSummary> {
    const versions = this.ensureObjectVersions(key);
    const latest = this.getLatestLiveVersion(versions);
    if (!latest?.body) {
      throw this.createMockError(
        ApiErrorCode.S3_SYNC_FAILED,
        `Object not found: ${key}`,
        null,
      );
    }

    return {
      key,
      lastModified: latest.lastModified,
      size: latest.body.length,
      eTag: latest.eTag,
    };
  }

  async deleteObject(key: string): Promise<void> {
    const store = this.ensureBucketStore();
    const versions = store.get(key) || [];
    versions.push({
      versionId: this.createVersionId(),
      lastModified: new Date(),
      body: null,
    });
    store.set(key, versions);
  }

  private ensureBucketStore(): BucketStore {
    const bucket = this.mockSettings?.bucket;
    if (!bucket) {
      throw this.createMockError(
        ApiErrorCode.S3_SYNC_FAILED,
        "S3 bucket is not configured",
        null,
      );
    }

    const store = this.buckets.get(bucket);
    if (!store) {
      throw this.createMockError(
        ApiErrorCode.S3_SYNC_FAILED,
        `Bucket not initialized: ${bucket}`,
        null,
      );
    }

    return store;
  }

  private ensureObjectVersions(key: string): MockVersion[] {
    const store = this.ensureBucketStore();
    const versions = store.get(key);
    if (!versions || versions.length === 0) {
      throw this.createMockError(
        ApiErrorCode.S3_SYNC_FAILED,
        `Object not found: ${key}`,
        null,
      );
    }
    return versions;
  }

  private getLatestLiveVersion(versions: MockVersion[]): MockVersion | null {
    if (versions.length === 0) {
      return null;
    }
    const latest = versions[versions.length - 1];
    if (!latest.body) {
      return null;
    }
    return latest;
  }

  private createVersionId(): string {
    return `mock-s3-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private async toBuffer(
    body: Buffer | Uint8Array | Readable,
  ): Promise<Buffer> {
    if (Buffer.isBuffer(body)) {
      return Buffer.from(body);
    }

    if (body instanceof Uint8Array) {
      return Buffer.from(body);
    }

    return await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      body.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      body.on("end", () => resolve(Buffer.concat(chunks)));
      body.on("error", reject);
    });
  }

  private createMockError(
    code: ApiErrorCode,
    message: string,
    details?: any,
  ): ApiError {
    return { code, message, details };
  }
}
