import { S3Adapter } from "../../../backend/adapters/S3Adapter";
import { ApiErrorCode, REPO_PROVIDERS } from "../../../shared/types";
import { Readable } from "stream";

jest.mock("@aws-sdk/client-s3", () => {
  const sendMock = jest.fn();
  return {
    S3Client: jest.fn(() => ({ send: sendMock })),
    ListObjectsV2Command: jest.fn((input) => ({ input })),
    GetObjectCommand: jest.fn((input) => ({ input })),
    PutObjectCommand: jest.fn((input) => ({ input })),
    DeleteObjectCommand: jest.fn((input) => ({ input })),
    HeadObjectCommand: jest.fn((input) => ({ input })),
    GetBucketVersioningCommand: jest.fn((input) => ({ input })),
    ListObjectVersionsCommand: jest.fn((input) => ({ input })),
    __sendMock: sendMock,
  };
});

describe("S3Adapter", () => {
  let adapter: S3Adapter;
  let sendMock: jest.Mock;

  beforeEach(() => {
    sendMock = (jest.requireMock("@aws-sdk/client-s3") as any).__sendMock;
    sendMock.mockReset();
    adapter = new S3Adapter();
    adapter.configure({
      provider: REPO_PROVIDERS.s3,
      bucket: "notes-bucket",
      region: "us-east-1",
      prefix: "",
      localPath: "/tmp/notegit-s3",
      accessKeyId: "access-key",
      secretAccessKey: "secret-key",
      sessionToken: "",
    });
  });

  it("paginates listObjects", async () => {
    sendMock
      .mockResolvedValueOnce({
        Contents: [
          {
            Key: "notes/a.md",
            LastModified: new Date("2024-01-01T10:00:00Z"),
            Size: 10,
          },
        ],
        IsTruncated: true,
        NextContinuationToken: "token-1",
      })
      .mockResolvedValueOnce({
        Contents: [
          {
            Key: "notes/b.md",
            LastModified: new Date("2024-01-02T10:00:00Z"),
            Size: 20,
          },
        ],
        IsTruncated: false,
      });

    const results = await adapter.listObjects("notes/");

    expect(results.map((item) => item.key)).toEqual([
      "notes/a.md",
      "notes/b.md",
    ]);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock.mock.calls[0][0].input).toMatchObject({
      Bucket: "notes-bucket",
      Prefix: "notes/",
      ContinuationToken: undefined,
    });
    expect(sendMock.mock.calls[1][0].input).toMatchObject({
      Bucket: "notes-bucket",
      Prefix: "notes/",
      ContinuationToken: "token-1",
    });
  });

  it("lists object versions and filters by prefix", async () => {
    sendMock.mockResolvedValueOnce({
      Versions: [
        { Key: "notes/a.md", VersionId: "v1", IsLatest: true },
        { Key: "notes/b.md", VersionId: "v2", IsLatest: false },
      ],
      IsTruncated: false,
    });

    const results = await adapter.listObjectVersions("notes/a.md");

    expect(results).toHaveLength(1);
    expect(results[0].versionId).toBe("v1");
  });

  it("returns buffer when getObject body is a Buffer", async () => {
    sendMock.mockResolvedValue({
      Body: Buffer.from("hello"),
    });

    const result = await adapter.getObject("notes/a.md");

    expect(result.toString("utf-8")).toBe("hello");
  });

  it("returns buffer when getObject body is Uint8Array", async () => {
    sendMock.mockResolvedValue({
      Body: new Uint8Array([65, 66]),
    });

    const result = await adapter.getObject("notes/a.md");

    expect(result.toString("utf-8")).toBe("AB");
  });

  it("uploads and deletes objects", async () => {
    sendMock.mockResolvedValue({});

    await adapter.putObject("notes/a.md", Buffer.from("data"), "text/plain");
    await adapter.deleteObject("notes/a.md");

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock.mock.calls[0][0].input).toMatchObject({
      Bucket: "notes-bucket",
      Key: "notes/a.md",
      ContentType: "text/plain",
    });
    expect(sendMock.mock.calls[1][0].input).toMatchObject({
      Bucket: "notes-bucket",
      Key: "notes/a.md",
    });
  });

  it("returns metadata from headObject", async () => {
    sendMock.mockResolvedValue({
      LastModified: new Date("2024-01-02T10:00:00Z"),
      ContentLength: 42,
      ETag: '"etag"',
    });

    const result = await adapter.headObject("notes/a.md");

    expect(result).toMatchObject({
      key: "notes/a.md",
      size: 42,
      eTag: '"etag"',
    });
  });

  it("throws when adapter is not configured", async () => {
    const unconfigured = new S3Adapter();

    await expect(unconfigured.listObjects("notes/")).rejects.toMatchObject({
      code: ApiErrorCode.S3_SYNC_FAILED,
    });
  });

  it("maps auth errors to S3_AUTH_FAILED", async () => {
    sendMock.mockRejectedValue({ name: "AccessDenied" });

    await expect(adapter.getBucketVersioning()).rejects.toMatchObject({
      code: ApiErrorCode.S3_AUTH_FAILED,
    });
  });

  it("returns bucket versioning status", async () => {
    sendMock.mockResolvedValue({ Status: "Enabled" });

    const result = await adapter.getBucketVersioning();

    expect(result).toBe("Enabled");
  });

  it("maps non-auth errors to S3_SYNC_FAILED", async () => {
    sendMock.mockRejectedValue(new Error("boom"));

    await expect(adapter.listObjects("notes/")).rejects.toMatchObject({
      code: ApiErrorCode.S3_SYNC_FAILED,
    });
  });

  it("reads stream bodies into a buffer", async () => {
    const stream = Readable.from(["hello", " ", "world"]);
    sendMock.mockResolvedValue({
      Body: stream,
    });

    const result = await adapter.getObject("notes/stream.md");

    expect(result.toString("utf-8")).toBe("hello world");
  });
});
