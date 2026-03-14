import * as path from "path";
import { FsAdapter } from "../../../backend/adapters/FsAdapter";
import { ConfigService } from "../../../backend/services/ConfigService";
import { DefaultLocalRepoBootstrapService } from "../../../backend/services/DefaultLocalRepoBootstrapService";
import { REPO_PROVIDERS } from "../../../shared/types";

describe("DefaultLocalRepoBootstrapService", () => {
  const reposBaseDir = path.join("/tmp/NoteBranch-test", "repos");
  const defaultRepoPath = path.join(reposBaseDir, "default");
  const tutorialsRootDir = "/workspace/tutorials";

  const createHarness = () => {
    const existingDirectories = new Set<string>();
    const existingFiles = new Set<string>();

    const fsAdapter = {
      exists: jest.fn(async (targetPath: string) => {
        if (targetPath.startsWith(tutorialsRootDir)) {
          return true;
        }
        return (
          existingDirectories.has(targetPath) || existingFiles.has(targetPath)
        );
      }),
      mkdir: jest.fn(async (dirPath: string) => {
        existingDirectories.add(dirPath);
      }),
      stat: jest.fn(async (targetPath: string) => ({
        isDirectory: () => existingDirectories.has(targetPath),
      })),
      writeFile: jest.fn(async (filePath: string) => {
        existingFiles.add(filePath);
      }),
      copyFile: jest.fn(async (_source: string, destination: string) => {
        existingFiles.add(destination);
      }),
    } as unknown as jest.Mocked<FsAdapter>;

    const configService = {
      ensureConfigDir: jest.fn().mockResolvedValue(undefined),
      migrateToProfiles: jest.fn().mockResolvedValue(undefined),
      getProfiles: jest.fn().mockResolvedValue([]),
      getActiveProfileId: jest.fn().mockResolvedValue(null),
      saveProfiles: jest.fn().mockResolvedValue(undefined),
      setActiveProfileId: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ConfigService>;

    const service = new DefaultLocalRepoBootstrapService(
      fsAdapter,
      configService,
    );

    return {
      service,
      fsAdapter,
      configService,
      existingDirectories,
      existingFiles,
    };
  };

  it("creates a default local profile and seeds tutorial files on first install", async () => {
    const { service, fsAdapter, configService } = createHarness();

    await service.ensureDefaultLocalRepo({
      tutorialsRootDir,
      integrationTestMode: false,
    });

    expect(configService.saveProfiles).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "default",
          repoSettings: {
            provider: REPO_PROVIDERS.local,
            localPath: defaultRepoPath,
          },
        }),
      ]),
    );
    expect(configService.setActiveProfileId).toHaveBeenCalledWith(
      "profile-default-local",
    );
    expect(fsAdapter.writeFile).toHaveBeenCalledWith(
      path.join(defaultRepoPath, "HOW_TO.md"),
      expect.stringContaining("What is NoteGit?"),
    );
    expect(fsAdapter.copyFile).toHaveBeenCalled();
  });

  it("reuses existing default repository directory when present", async () => {
    const { service, configService, existingDirectories } = createHarness();
    existingDirectories.add(defaultRepoPath);

    await service.ensureDefaultLocalRepo({
      tutorialsRootDir,
      integrationTestMode: false,
    });

    expect(configService.saveProfiles).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          repoSettings: expect.objectContaining({
            localPath: defaultRepoPath,
          }),
        }),
      ]),
    );
  });

  it("does nothing when profiles already exist", async () => {
    const { service, fsAdapter, configService } = createHarness();
    configService.getProfiles.mockResolvedValueOnce([
      {
        id: "profile-existing",
        name: "Existing",
        repoSettings: {
          provider: REPO_PROVIDERS.local,
          localPath: "/tmp/existing",
        },
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      } as any,
    ]);

    await service.ensureDefaultLocalRepo({
      tutorialsRootDir,
      integrationTestMode: false,
    });

    expect(configService.saveProfiles).not.toHaveBeenCalled();
    expect(configService.setActiveProfileId).not.toHaveBeenCalled();
    expect(fsAdapter.writeFile).not.toHaveBeenCalled();
  });

  it("skips bootstrap in integration test mode", async () => {
    const { service, configService, fsAdapter } = createHarness();

    await service.ensureDefaultLocalRepo({
      tutorialsRootDir,
      integrationTestMode: true,
    });

    expect(configService.ensureConfigDir).not.toHaveBeenCalled();
    expect(configService.saveProfiles).not.toHaveBeenCalled();
    expect(fsAdapter.writeFile).not.toHaveBeenCalled();
  });
});
