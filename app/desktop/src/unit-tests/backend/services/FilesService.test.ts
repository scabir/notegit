import { FilesService } from "../../../backend/services/FilesService";
import { FsAdapter } from "../../../backend/adapters/FsAdapter";
import { ConfigService } from "../../../backend/services/ConfigService";
import { GitAdapter } from "../../../backend/adapters/GitAdapter";
import {
  FileType,
  AuthMethod,
  ApiErrorCode,
  REPO_PROVIDERS,
} from "../../../shared/types";
import { Stats } from "fs";
import * as path from "path";

jest.mock("../../../backend/adapters/FsAdapter");
jest.mock("../../../backend/services/ConfigService");
jest.mock("../../../backend/adapters/GitAdapter");

describe("FilesService", () => {
  let filesService: FilesService;
  let mockFsAdapter: jest.Mocked<FsAdapter>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockGitAdapter: jest.Mocked<GitAdapter>;

  beforeEach(() => {
    mockFsAdapter = new FsAdapter() as jest.Mocked<FsAdapter>;
    mockFsAdapter.rmdir = jest.fn();
    mockFsAdapter.rename = jest.fn();
    mockFsAdapter.copyFile = jest.fn();

    mockConfigService = new ConfigService(
      {} as any,
      {} as any,
    ) as jest.Mocked<ConfigService>;
    mockGitAdapter = new GitAdapter() as jest.Mocked<GitAdapter>;

    filesService = new FilesService(mockFsAdapter, mockConfigService);
    filesService.setGitAdapter(mockGitAdapter);

    jest.clearAllMocks();
  });

  describe("init", () => {
    it("should initialize with repo path from config", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/path/to/repo",
        remoteUrl: "https://github.com/user/repo.git",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      await filesService.init();

      expect(mockConfigService.getRepoSettings).toHaveBeenCalled();
    });
  });

  describe("getFileType", () => {
    it("should identify markdown files", () => {
      expect(filesService.getFileType("note.md")).toBe(FileType.MARKDOWN);
      expect(filesService.getFileType("README.markdown")).toBe(
        FileType.MARKDOWN,
      );
    });

    it("should identify image files", () => {
      expect(filesService.getFileType("photo.png")).toBe(FileType.IMAGE);
      expect(filesService.getFileType("image.jpg")).toBe(FileType.IMAGE);
      expect(filesService.getFileType("pic.jpeg")).toBe(FileType.IMAGE);
      expect(filesService.getFileType("icon.svg")).toBe(FileType.IMAGE);
    });

    it("should identify PDF files", () => {
      expect(filesService.getFileType("document.pdf")).toBe(FileType.PDF);
    });

    it("should identify JSON files", () => {
      expect(filesService.getFileType("config.json")).toBe(FileType.JSON);
    });

    it("should identify code files", () => {
      expect(filesService.getFileType("script.js")).toBe(FileType.CODE);
      expect(filesService.getFileType("app.ts")).toBe(FileType.CODE);
      expect(filesService.getFileType("main.py")).toBe(FileType.CODE);
      expect(filesService.getFileType("App.java")).toBe(FileType.CODE);
    });

    it("should identify text files", () => {
      expect(filesService.getFileType("notes.txt")).toBe(FileType.TEXT);
      expect(filesService.getFileType("data.csv")).toBe(FileType.TEXT);
      expect(filesService.getFileType("config.yml")).toBe(FileType.TEXT);
    });

    it("should return OTHER for unknown types", () => {
      expect(filesService.getFileType("file.xyz")).toBe(FileType.OTHER);
      expect(filesService.getFileType("noext")).toBe(FileType.OTHER);
    });
  });

  describe("readFile", () => {
    it("should read file content", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.readFile.mockResolvedValue("# Hello World");
      mockFsAdapter.stat.mockResolvedValue({
        size: 100,
        mtime: new Date(),
        isDirectory: () => false,
        isFile: () => true,
      } as Stats);

      const content = await filesService.readFile("notes/test.md");

      expect(content.path).toBe("notes/test.md");
      expect(content.content).toBe("# Hello World");
      expect(content.type).toBe(FileType.MARKDOWN);
      expect(content.size).toBe(100);
    });

    it("rethrows read failures", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.readFile.mockRejectedValue(new Error("read failed"));

      await expect(filesService.readFile("notes/test.md")).rejects.toThrow(
        "read failed",
      );
    });
  });

  describe("getGitStatus", () => {
    it("returns normalized git status arrays", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockGitAdapter.init.mockResolvedValue(undefined);
      mockGitAdapter.status.mockResolvedValue({
        modified: ["a.md"],
        created: ["b.md"],
        deleted: ["c.md"],
      } as any);

      const result = await filesService.getGitStatus();

      expect(result).toEqual({
        modified: ["a.md"],
        added: ["b.md"],
        deleted: ["c.md"],
      });
    });

    it("rejects git status for non-git repositories", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.s3,
        localPath: "/repo",
        bucket: "notes-bucket",
        region: "us-east-1",
        prefix: "",
        accessKeyId: "access-key",
        secretAccessKey: "secret-key",
        sessionToken: "",
      });

      await expect(filesService.getGitStatus()).rejects.toMatchObject({
        code: ApiErrorCode.REPO_PROVIDER_MISMATCH,
      });
    });
  });

  describe("saveFile", () => {
    it("should save file content", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      await filesService.saveFile("notes/test.md", "# Updated Content");

      expect(mockFsAdapter.writeFile).toHaveBeenCalled();
    });

    it("rethrows save failures", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.writeFile.mockRejectedValue(new Error("write failed"));

      await expect(
        filesService.saveFile("notes/test.md", "content"),
      ).rejects.toThrow("write failed");
    });
  });

  describe("saveWithGitWorkflow", () => {
    beforeEach(() => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.writeFile.mockResolvedValue(undefined);
      mockGitAdapter.init.mockResolvedValue(undefined);
      mockGitAdapter.add.mockResolvedValue(undefined);
      mockGitAdapter.commit.mockResolvedValue(undefined);
      mockGitAdapter.pull.mockResolvedValue(undefined);
      mockGitAdapter.push.mockResolvedValue(undefined);
    });

    it("saves, commits, pulls, and pushes on success", async () => {
      const result = await filesService.saveWithGitWorkflow(
        "notes/test.md",
        "content",
      );

      expect(mockGitAdapter.add).toHaveBeenCalledWith("notes/test.md");
      expect(mockGitAdapter.commit).toHaveBeenCalledWith(
        "Update note: test.md",
      );
      expect(mockGitAdapter.pull).toHaveBeenCalled();
      expect(mockGitAdapter.push).toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it("uses autosave commit message when requested", async () => {
      await filesService.saveWithGitWorkflow("notes/test.md", "content", true);

      expect(mockGitAdapter.commit).toHaveBeenCalledWith("Autosave: test.md");
    });

    it("marks pull failure and conflict without pushing", async () => {
      mockGitAdapter.pull.mockRejectedValue(new Error("CONFLICT in file"));

      const result = await filesService.saveWithGitWorkflow(
        "notes/test.md",
        "content",
      );

      expect(result.pullFailed).toBe(true);
      expect(result.conflictDetected).toBe(true);
      expect(mockGitAdapter.push).not.toHaveBeenCalled();
    });

    it("marks pull failure and still pushes when not a conflict", async () => {
      mockGitAdapter.pull.mockRejectedValue(new Error("Network error"));

      const result = await filesService.saveWithGitWorkflow(
        "notes/test.md",
        "content",
      );

      expect(result.pullFailed).toBe(true);
      expect(result.conflictDetected).toBeUndefined();
      expect(mockGitAdapter.push).toHaveBeenCalled();
    });

    it("marks push failure when push fails", async () => {
      mockGitAdapter.push.mockRejectedValue(new Error("Push failed"));

      const result = await filesService.saveWithGitWorkflow(
        "notes/test.md",
        "content",
      );

      expect(result.pushFailed).toBe(true);
    });

    it("continues when commit fails", async () => {
      mockGitAdapter.commit.mockRejectedValue(new Error("Nothing to commit"));

      const result = await filesService.saveWithGitWorkflow(
        "notes/test.md",
        "content",
      );

      expect(mockGitAdapter.pull).toHaveBeenCalled();
      expect(mockGitAdapter.push).toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it("rethrows when saving the file fails before git workflow starts", async () => {
      mockFsAdapter.writeFile.mockRejectedValue(new Error("disk full"));

      await expect(
        filesService.saveWithGitWorkflow("notes/test.md", "content"),
      ).rejects.toThrow("disk full");
    });
  });

  describe("createFile", () => {
    it("should create markdown file with default content", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      await filesService.createFile("notes", "new-note.md");

      expect(mockFsAdapter.writeFile).toHaveBeenCalled();
      const savedContent = mockFsAdapter.writeFile.mock.calls[0][1];
      expect(savedContent).toContain("# new-note");
    });

    it("should create empty file for non-markdown files", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      await filesService.createFile("docs", "data.txt");

      expect(mockFsAdapter.writeFile).toHaveBeenCalled();
      const savedContent = mockFsAdapter.writeFile.mock.calls[0][1];
      expect(savedContent).toBe("");
    });

    it("should replace spaces in S3 file names", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.s3,
        localPath: "/repo",
        bucket: "notes-bucket",
        region: "us-east-1",
        prefix: "",
        accessKeyId: "access-key",
        secretAccessKey: "secret-key",
        sessionToken: "",
      });

      mockFsAdapter.writeFile.mockResolvedValue(undefined);

      await filesService.createFile("notes", "my note.md");

      expect(mockFsAdapter.writeFile).toHaveBeenCalledWith(
        "/repo/notes/my-note.md",
        expect.any(String),
      );
    });

    it("rethrows create file failures", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.writeFile.mockRejectedValue(new Error("create failed"));

      await expect(filesService.createFile("", "note.md")).rejects.toThrow(
        "create failed",
      );
    });
  });

  describe("createFolder", () => {
    it("should create a folder", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.mkdir.mockResolvedValue(undefined);

      await filesService.createFolder("notes", "subfolder");

      expect(mockFsAdapter.mkdir).toHaveBeenCalled();
    });

    it("should replace spaces in S3 folder names", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.s3,
        localPath: "/repo",
        bucket: "notes-bucket",
        region: "us-east-1",
        prefix: "",
        accessKeyId: "access-key",
        secretAccessKey: "secret-key",
        sessionToken: "",
      });

      mockFsAdapter.mkdir.mockResolvedValue(undefined);

      await filesService.createFolder("notes", "my folder");

      expect(mockFsAdapter.mkdir).toHaveBeenCalledWith(
        "/repo/notes/my-folder",
        { recursive: false },
      );
    });

    it("rethrows folder creation failures", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.mkdir.mockRejectedValue(new Error("mkdir failed"));

      await expect(filesService.createFolder("", "folder")).rejects.toThrow(
        "mkdir failed",
      );
    });
  });

  describe("deletePath", () => {
    it("should delete a file", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.stat.mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      } as Stats);

      mockFsAdapter.deleteFile.mockResolvedValue(undefined);

      await filesService.deletePath("notes/old.md");

      expect(mockFsAdapter.deleteFile).toHaveBeenCalled();
    });

    it("should recursively delete a directory", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.stat.mockResolvedValueOnce({
        isDirectory: () => true,
        isFile: () => false,
      } as Stats);

      mockFsAdapter.rmdir.mockResolvedValue(undefined);

      await filesService.deletePath("old-folder");

      expect(mockFsAdapter.rmdir).toHaveBeenCalledWith("/repo/old-folder", {
        recursive: true,
      });
    });

    it("rethrows delete failures", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.stat.mockRejectedValue(new Error("stat failed"));

      await expect(filesService.deletePath("notes/old.md")).rejects.toThrow(
        "stat failed",
      );
    });
  });

  describe("renamePath", () => {
    it("should rename a file", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.rename.mockResolvedValue(undefined);

      await filesService.renamePath("old.md", "new.md");

      expect(mockFsAdapter.rename).toHaveBeenCalled();
    });

    it("should replace spaces in S3 rename targets", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.s3,
        localPath: "/repo",
        bucket: "notes-bucket",
        region: "us-east-1",
        prefix: "",
        accessKeyId: "access-key",
        secretAccessKey: "secret-key",
        sessionToken: "",
      });

      mockFsAdapter.rename.mockResolvedValue(undefined);

      await filesService.renamePath("old.md", "new name.md");

      expect(mockFsAdapter.rename).toHaveBeenCalledWith(
        "/repo/old.md",
        "/repo/new-name.md",
      );
    });
  });

  describe("commitFile", () => {
    it("should stage and commit a file", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockGitAdapter.init.mockResolvedValue(undefined);
      mockGitAdapter.add.mockResolvedValue(undefined);
      mockGitAdapter.commit.mockResolvedValue(undefined);

      await filesService.commitFile("notes/test.md", "Update test note");

      expect(mockGitAdapter.init).toHaveBeenCalled();
      expect(mockGitAdapter.add).toHaveBeenCalledWith("notes/test.md");
      expect(mockGitAdapter.commit).toHaveBeenCalledWith("Update test note");
    });

    it("rethrows commitFile git failures", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockGitAdapter.init.mockResolvedValue(undefined);
      mockGitAdapter.add.mockResolvedValue(undefined);
      mockGitAdapter.commit.mockRejectedValue(new Error("commit failed"));

      await expect(
        filesService.commitFile("notes/test.md", "Update test note"),
      ).rejects.toThrow("commit failed");
    });
  });

  describe("commitAll", () => {
    it("should stage and commit all changes", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockGitAdapter.init.mockResolvedValue(undefined);
      mockGitAdapter.add.mockResolvedValue(undefined);
      mockGitAdapter.commit.mockResolvedValue(undefined);

      await filesService.commitAll("Update notes");

      expect(mockGitAdapter.init).toHaveBeenCalled();
      expect(mockGitAdapter.add).toHaveBeenCalledWith(".");
      expect(mockGitAdapter.commit).toHaveBeenCalledWith("Update notes");
    });

    it("should reject commit operations for S3 repositories", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.s3,
        localPath: "/repo",
        bucket: "notes-bucket",
        region: "us-east-1",
        prefix: "",
        accessKeyId: "access-key",
        secretAccessKey: "secret-key",
        sessionToken: "",
      });

      await expect(
        filesService.commitAll("Update notes"),
      ).rejects.toMatchObject({
        code: ApiErrorCode.REPO_PROVIDER_MISMATCH,
      });
    });

    it("rethrows commitAll git failures", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockGitAdapter.init.mockResolvedValue(undefined);
      mockGitAdapter.add.mockResolvedValue(undefined);
      mockGitAdapter.commit.mockRejectedValue(new Error("commit failed"));

      await expect(filesService.commitAll("Update notes")).rejects.toThrow(
        "commit failed",
      );
    });
  });

  describe("listTree", () => {
    it("should build file tree structure", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.readdir
        .mockResolvedValueOnce(["notes", "file1.md"])
        .mockResolvedValueOnce(["note1.md", "note2.md"]);

      mockFsAdapter.stat
        .mockResolvedValueOnce({
          isDirectory: () => true,
          isFile: () => false,
        } as Stats)
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats)
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats)
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats);

      const tree = await filesService.listTree();

      expect(tree).toHaveLength(2);
      expect(tree[0].type).toBe("folder");
      expect(tree[0].name).toBe("notes");
      expect(tree[0].children).toHaveLength(2);
      expect(tree[1].type).toBe("file");
      expect(tree[1].name).toBe("file1.md");
    });

    it("should filter hidden files", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.readdir.mockResolvedValue([
        ".hidden",
        ".git",
        "visible.md",
      ]);

      mockFsAdapter.stat.mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      } as Stats);

      const tree = await filesService.listTree();

      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe("visible.md");
    });

    it("should sort folders before files", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.readdir.mockResolvedValueOnce([
        "file.md",
        "folder",
        "another.md",
      ]);

      mockFsAdapter.stat
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats)
        .mockResolvedValueOnce({
          isDirectory: () => true,
          isFile: () => false,
        } as Stats)
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats);

      mockFsAdapter.readdir.mockResolvedValueOnce([]);

      const tree = await filesService.listTree();

      expect(tree[0].type).toBe("folder");
      expect(tree[1].type).toBe("file");
      expect(tree[2].type).toBe("file");
    });

    it("skips entries whose stat calls fail", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.readdir.mockResolvedValue(["good.md", "bad.md"]);
      mockFsAdapter.stat
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats)
        .mockRejectedValueOnce(new Error("Permission denied"));

      const tree = await filesService.listTree();

      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe("good.md");
    });
  });

  describe("renamePath", () => {
    beforeEach(async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });
      await filesService.init();
    });

    it("should rename a file", async () => {
      mockFsAdapter.rename.mockResolvedValue();

      await filesService.renamePath("old-note.md", "new-note.md");

      expect(mockFsAdapter.rename).toHaveBeenCalledWith(
        "/repo/old-note.md",
        "/repo/new-note.md",
      );
    });

    it("should move a file to another directory", async () => {
      mockFsAdapter.rename.mockResolvedValue();

      await filesService.renamePath("note.md", "folder/note.md");

      expect(mockFsAdapter.rename).toHaveBeenCalledWith(
        "/repo/note.md",
        "/repo/folder/note.md",
      );
    });

    it("should rename a folder", async () => {
      mockFsAdapter.rename.mockResolvedValue();

      await filesService.renamePath("old-folder", "new-folder");

      expect(mockFsAdapter.rename).toHaveBeenCalledWith(
        "/repo/old-folder",
        "/repo/new-folder",
      );
    });

    it("should move a folder to another directory", async () => {
      mockFsAdapter.rename.mockResolvedValue();

      await filesService.renamePath("folder1", "parent/folder1");

      expect(mockFsAdapter.rename).toHaveBeenCalledWith(
        "/repo/folder1",
        "/repo/parent/folder1",
      );
    });

    it("should handle nested paths correctly", async () => {
      mockFsAdapter.rename.mockResolvedValue();

      await filesService.renamePath(
        "parent/child/note.md",
        "parent/child/renamed.md",
      );

      expect(mockFsAdapter.rename).toHaveBeenCalledWith(
        "/repo/parent/child/note.md",
        "/repo/parent/child/renamed.md",
      );
    });

    it("should throw error if rename fails", async () => {
      mockFsAdapter.rename.mockRejectedValue(new Error("Permission denied"));

      await expect(
        filesService.renamePath("note.md", "renamed.md"),
      ).rejects.toThrow();
    });

    it("should handle moving to root directory", async () => {
      mockFsAdapter.rename.mockResolvedValue();

      await filesService.renamePath("folder/note.md", "note.md");

      expect(mockFsAdapter.rename).toHaveBeenCalledWith(
        "/repo/folder/note.md",
        "/repo/note.md",
      );
    });
  });

  describe("importFile", () => {
    it("should normalize spaces for S3 target paths", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.s3,
        localPath: "/repo",
        bucket: "notes-bucket",
        region: "us-east-1",
        prefix: "",
        accessKeyId: "access-key",
        secretAccessKey: "secret-key",
        sessionToken: "",
      });

      mockFsAdapter.mkdir.mockResolvedValue(undefined);
      mockFsAdapter.copyFile.mockResolvedValue(undefined);

      await filesService.importFile("/source/file.txt", "folder/my file.txt");

      expect(mockFsAdapter.mkdir).toHaveBeenCalledWith("/repo/folder", {
        recursive: true,
      });
      expect(mockFsAdapter.copyFile).toHaveBeenCalledWith(
        "/source/file.txt",
        "/repo/folder/my-file.txt",
      );
    });
  });

  describe("saveFileAs", () => {
    it("copies the repo file to the destination path", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.copyFile.mockResolvedValue(undefined);

      await filesService.saveFileAs("notes/test.md", "/tmp/exported.md");

      expect(mockFsAdapter.copyFile).toHaveBeenCalledWith(
        "/repo/notes/test.md",
        "/tmp/exported.md",
      );
    });

    it("rethrows export copy failures", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      mockFsAdapter.copyFile.mockRejectedValue(new Error("copy failed"));

      await expect(
        filesService.saveFileAs("notes/test.md", "/tmp/exported.md"),
      ).rejects.toThrow("copy failed");
    });
  });

  describe("duplicateFile", () => {
    beforeEach(async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });
      await filesService.init();
    });

    it("duplicates with incremented name", async () => {
      mockFsAdapter.stat.mockResolvedValue({ isFile: () => true } as any);
      mockFsAdapter.exists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      mockFsAdapter.copyFile.mockResolvedValue(undefined);

      const result = await filesService.duplicateFile("note.md");

      expect(mockFsAdapter.copyFile).toHaveBeenCalledWith(
        "/repo/note.md",
        "/repo/note(2).md",
      );
      expect(result).toBe(path.join("note(2).md"));
    });

    it("throws when source is not a file", async () => {
      mockFsAdapter.stat.mockResolvedValue({ isFile: () => false } as any);
      await expect(filesService.duplicateFile("folder")).rejects.toBeTruthy();
    });
  });

  describe("repo validation", () => {
    it("throws when no repository is configured", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue(null);

      await expect(filesService.listTree()).rejects.toMatchObject({
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    });

    it("throws when the git adapter is not set for commit operations", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      const serviceWithoutGit = new FilesService(
        mockFsAdapter,
        mockConfigService,
      );

      await expect(
        serviceWithoutGit.commitFile("notes/test.md", "message"),
      ).rejects.toMatchObject({
        code: ApiErrorCode.UNKNOWN_ERROR,
      });
    });

    it("throws when git status is requested without a git adapter", async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });

      const serviceWithoutGit = new FilesService(
        mockFsAdapter,
        mockConfigService,
      );

      await expect(serviceWithoutGit.getGitStatus()).rejects.toMatchObject({
        code: ApiErrorCode.UNKNOWN_ERROR,
      });
    });
  });

  describe("deletePath", () => {
    beforeEach(async () => {
      mockConfigService.getRepoSettings.mockResolvedValue({
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
        remoteUrl: "url",
        branch: "main",
        pat: "token",
        authMethod: AuthMethod.PAT,
      });
      await filesService.init();
    });

    it("should delete a file", async () => {
      mockFsAdapter.stat.mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      } as Stats);
      mockFsAdapter.deleteFile.mockResolvedValue();

      await filesService.deletePath("note.md");

      expect(mockFsAdapter.deleteFile).toHaveBeenCalledWith("/repo/note.md");
    });
  });
});
