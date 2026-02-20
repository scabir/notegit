import { Readable } from "stream";
import { MockS3Adapter } from "../../../backend/adapters/MockS3Adapter";
import { ApiErrorCode, REPO_PROVIDERS } from "../../../shared/types";

const baseSettings = {
  provider: REPO_PROVIDERS.s3,
  bucket: "bucket-a",
  region: "us-east-1",
  prefix: "",
  localPath: "/tmp/mock-s3",
  accessKeyId: "key",
  secretAccessKey: "secret",
  sessionToken: "",
} as const;

describe("MockS3Adapter", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("fails when bucket is not configured", async () => {
    const adapter = new MockS3Adapter();
    await expect(adapter.listObjects("")).rejects.toMatchObject({
      code: ApiErrorCode.S3_SYNC_FAILED,
      message: "S3 bucket is not configured",
    });
  });

  it("supports configure and bucket versioning env override", async () => {
    const adapter = new MockS3Adapter();
    adapter.configure({ ...baseSettings });

    await expect(adapter.getBucketVersioning()).resolves.toBe("Enabled");

    process.env.NOTEGIT_MOCK_S3_VERSIONING_STATUS = "Suspended";
    await expect(adapter.getBucketVersioning()).resolves.toBe("Suspended");

    process.env.NOTEGIT_MOCK_S3_VERSIONING_STATUS = "";
    await expect(adapter.getBucketVersioning()).resolves.toBe("Enabled");

    process.env.NOTEGIT_MOCK_S3_VERSIONING_STATUS = "bad-value";
    await expect(adapter.getBucketVersioning()).resolves.toBe("Enabled");
  });

  it("puts, heads and lists objects with prefix filtering", async () => {
    const adapter = new MockS3Adapter();
    adapter.configure({ ...baseSettings });

    await adapter.putObject("docs/a.md", Buffer.from("A"));
    await adapter.putObject("docs/b.md", new Uint8Array([66]));
    await adapter.putObject("images/logo.png", Buffer.from("PNG"));

    const listed = await adapter.listObjects("docs/");
    expect(listed.map((entry) => entry.key)).toEqual([
      "docs/a.md",
      "docs/b.md",
    ]);

    const head = await adapter.headObject("docs/a.md");
    expect(head.key).toBe("docs/a.md");
    expect(head.size).toBe(1);
    expect(head.eTag).toMatch(/^".+"$/);
  });

  it("gets latest and specific object versions", async () => {
    const adapter = new MockS3Adapter();
    adapter.configure({ ...baseSettings });

    await adapter.putObject("note.md", Buffer.from("v1"));
    await adapter.putObject("note.md", Buffer.from("v2"));

    const versions = await adapter.listObjectVersions("note.md");
    expect(versions).toHaveLength(2);
    expect(versions.some((entry) => entry.isLatest)).toBe(true);

    const latest = await adapter.getObject("note.md");
    expect(latest.toString("utf8")).toBe("v2");

    const firstVersion = versions.find((entry) => !entry.isLatest);
    expect(firstVersion).toBeDefined();
    const first = await adapter.getObject("note.md", firstVersion!.versionId);
    expect(first.toString("utf8")).toBe("v1");
  });

  it("accepts stream upload bodies", async () => {
    const adapter = new MockS3Adapter();
    adapter.configure({ ...baseSettings });

    const stream = Readable.from(["hello", " ", "stream"]);
    await adapter.putObject("stream.md", stream);
    const output = await adapter.getObject("stream.md");
    expect(output.toString("utf8")).toBe("hello stream");
  });

  it("tracks delete markers and reports missing objects after delete", async () => {
    const adapter = new MockS3Adapter();
    adapter.configure({ ...baseSettings });

    await adapter.putObject("delete-me.md", Buffer.from("data"));
    await adapter.deleteObject("delete-me.md");

    await expect(adapter.getObject("delete-me.md")).rejects.toMatchObject({
      code: ApiErrorCode.S3_SYNC_FAILED,
      message: "Object not found: delete-me.md",
    });
    await expect(adapter.headObject("delete-me.md")).rejects.toMatchObject({
      code: ApiErrorCode.S3_SYNC_FAILED,
      message: "Object not found: delete-me.md",
    });
    await expect(
      adapter.getObject("delete-me.md", "missing-version"),
    ).rejects.toMatchObject({
      code: ApiErrorCode.S3_SYNC_FAILED,
      message: "Object version not found: delete-me.md@missing-version",
    });

    const listed = await adapter.listObjects("");
    expect(listed.some((entry) => entry.key === "delete-me.md")).toBe(false);
  });

  it("keeps bucket stores isolated across reconfigure", async () => {
    const adapter = new MockS3Adapter();
    adapter.configure({ ...baseSettings, bucket: "bucket-a" });
    await adapter.putObject("a.md", Buffer.from("A"));

    adapter.configure({ ...baseSettings, bucket: "bucket-b" });
    await adapter.putObject("b.md", Buffer.from("B"));

    await expect(adapter.getObject("a.md")).rejects.toMatchObject({
      code: ApiErrorCode.S3_SYNC_FAILED,
    });
    await expect(adapter.getObject("b.md")).resolves.toEqual(Buffer.from("B"));
  });

  it("returns bucket not initialized when settings bucket has no store", async () => {
    const adapter = new MockS3Adapter() as any;
    adapter.mockSettings = { ...baseSettings, bucket: "ghost-bucket" };

    await expect(adapter.listObjects("")).rejects.toMatchObject({
      code: ApiErrorCode.S3_SYNC_FAILED,
      message: "Bucket not initialized: ghost-bucket",
    });
  });
});
