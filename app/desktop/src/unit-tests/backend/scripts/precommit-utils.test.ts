const precommitUtils = require("../../../../scripts/precommit-utils.js");

describe("precommit-utils", () => {
  it("normalizes and parses git file paths", () => {
    expect(precommitUtils.normalizeGitPath("./src\\backend\\a.ts")).toBe(
      "src/backend/a.ts",
    );

    expect(
      precommitUtils.parseGitFileList("src/a.ts\n./src\\b.ts\r\n\n"),
    ).toEqual(["src/a.ts", "src/b.ts"]);
  });

  it("detects merge conflict markers", () => {
    expect(precommitUtils.hasConflictMarkers("line 1\nline 2")).toBe(false);
    expect(
      precommitUtils.hasConflictMarkers("<<<<<<< HEAD\nfoo\n=======\nbar"),
    ).toBe(true);
  });

  it("detects high-confidence secret patterns", () => {
    const githubToken = `ghp_${"abcdefghijklmnopqrstuvwxyz123456"}`;
    const awsAccessKey = `AKIA${"1234567890ABCDEF"}`;
    const privateKeyHeader = `-----BEGIN ${"PRIVATE KEY-----"}`;
    const content = [
      `token=${githubToken}`,
      `aws=${awsAccessKey}`,
      privateKeyHeader,
    ].join("\n");

    const matches = precommitUtils.findSecretMatches(content);
    expect(matches).toEqual(
      expect.arrayContaining([
        "github-token",
        "aws-access-key-id",
        "private-key",
      ]),
    );
  });

  it("detects binary buffers and allows plain text", () => {
    expect(precommitUtils.isBinaryContent(Buffer.from("hello\nworld"))).toBe(
      false,
    );
    expect(precommitUtils.isBinaryContent(Buffer.from([0, 1, 2, 3, 4]))).toBe(
      true,
    );
  });

  it("validates lockfile consistency with staged package manifests", () => {
    expect(
      precommitUtils.evaluateLockfileConsistency(["src/backend/a.ts"]),
    ).toMatchObject({ ok: true });

    expect(
      precommitUtils.evaluateLockfileConsistency(["package.json"], {
        dependencyManifestChanged: false,
      }),
    ).toMatchObject({ ok: true });

    expect(
      precommitUtils.evaluateLockfileConsistency(["package.json"], {
        dependencyManifestChanged: true,
      }),
    ).toMatchObject({ ok: false });

    expect(
      precommitUtils.evaluateLockfileConsistency([
        "package.json",
        "pnpm-lock.yaml",
      ]),
    ).toMatchObject({ ok: true });

    expect(
      precommitUtils.evaluateLockfileConsistency([
        "app/desktop/package.json",
        "app/desktop/pnpm-lock.yaml",
      ]),
    ).toMatchObject({ ok: true });
  });

  it("detects package manifest paths correctly", () => {
    expect(precommitUtils.isPackageManifestPath("package.json")).toBe(true);
    expect(
      precommitUtils.isPackageManifestPath("app/desktop/package.json"),
    ).toBe(true);
    expect(precommitUtils.isPackageManifestPath("apps/ui/package.json")).toBe(
      true,
    );
    expect(
      precommitUtils.isPackageManifestPath("node_modules/foo/package.json"),
    ).toBe(false);
    expect(precommitUtils.isPackageManifestPath("README.md")).toBe(false);
  });

  it("resolves related unit tests from staged source files", () => {
    const existing = new Set([
      "src/unit-tests/backend/adapters/GitAdapter.test.ts",
      "src/unit-tests/frontend/components/Workspace.test.tsx",
      "src/unit-tests/backend/scripts/precommit-utils.test.ts",
    ]);
    const existsFn = (filePath: string) => existing.has(filePath);

    const tests = precommitUtils.resolveRelatedUnitTests(
      [
        "src/backend/adapters/GitAdapter.ts",
        "app/desktop/src/frontend/components/Workspace.tsx",
        "src/unit-tests/backend/scripts/precommit-utils.test.ts",
      ],
      existsFn,
    );

    expect(tests).toEqual([
      "src/unit-tests/backend/adapters/GitAdapter.test.ts",
      "src/unit-tests/backend/scripts/precommit-utils.test.ts",
      "src/unit-tests/frontend/components/Workspace.test.tsx",
    ]);
  });

  it("checks whether staged changes require unit test execution", () => {
    expect(precommitUtils.shouldRunUnitTests(["README.md"])).toBe(false);
    expect(precommitUtils.shouldRunUnitTests(["src/backend/service.ts"])).toBe(
      true,
    );
    expect(
      precommitUtils.shouldRunUnitTests(["app/desktop/src/backend/service.ts"]),
    ).toBe(true);
  });
});
