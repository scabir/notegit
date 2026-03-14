import * as path from "path";
import { FsAdapter } from "../adapters/FsAdapter";
import { ConfigService } from "./ConfigService";
import { logger } from "../utils/logger";
import {
  getDefaultReposBaseDir,
  findUniqueFolderName,
} from "../utils/profileHelpers";
import { Profile, REPO_PROVIDERS } from "../../shared/types";

const DEFAULT_PROFILE_ID = "profile-default-local";
const DEFAULT_PROFILE_NAME = "default";
const DEFAULT_REPO_DIR_NAME = "default";
const HOW_TO_FILE_NAME = "HOW_TO.md";
const HOW_TO_IMAGES_DIR_NAME = "images";

interface TutorialImageAsset {
  sourcePath: string;
  targetFileName: string;
}

const TUTORIAL_IMAGE_ASSETS: ReadonlyArray<TutorialImageAsset> = [
  {
    sourcePath:
      "scenarios/create-repo-on-NoteBranch/images/step-01-welcome-screen.png",
    targetFileName: "create-repo-step-01-welcome-screen.png",
  },
  {
    sourcePath:
      "scenarios/create-repo-on-NoteBranch/images/step-02-open-connect-dialog.png",
    targetFileName: "create-repo-step-02-open-connect-dialog.png",
  },
  {
    sourcePath:
      "scenarios/connect-git-repository/images/step-03-fill-git-details.png",
    targetFileName: "connect-git-step-03-fill-git-details.png",
  },
  {
    sourcePath:
      "scenarios/connect-git-repository/images/step-04-verify-connected-workspace.png",
    targetFileName: "connect-git-step-04-verify-connected-workspace.png",
  },
  {
    sourcePath:
      "scenarios/connect-s3-bucket-with-prefix/images/step-02-switch-to-s3-tab.png",
    targetFileName: "connect-s3-step-02-switch-to-s3-tab.png",
  },
  {
    sourcePath:
      "scenarios/connect-s3-bucket-with-prefix/images/step-05-verify-s3-connected.png",
    targetFileName: "connect-s3-step-05-verify-s3-connected.png",
  },
  {
    sourcePath:
      "scenarios/create-local-repository-and-work-offline/images/step-02-connected-local-workspace.png",
    targetFileName: "local-workspace-step-02-connected-local-workspace.png",
  },
];

const DEFAULT_HOW_TO_CONTENT = `# NoteGit Quick Start

Welcome to your default NoteGit workspace.

## What is NoteGit?

NoteGit is a markdown-first note application where each workspace is backed by a repository profile.

- Git profile: connect to a Git remote and use commit/pull/push workflows.
- S3 profile: connect to an S3 bucket + prefix and sync notes with object storage.
- Local profile: keep notes fully local and work offline with no remote sync.

## How workspaces work

A workspace is the local folder that NoteGit opens for the active profile.

- Each profile has its own local path.
- Only one profile is active at a time.
- Switching profile switches the workspace.
- Files in this folder are your notes and docs.

## Connect a Git repository

1. Open the repository connection dialog.
2. Keep repository type on **Git**.
3. Enter remote URL, branch, and token, then click **Connect**.

![Git connection details](images/connect-git-step-03-fill-git-details.png)
![Git workspace connected](images/connect-git-step-04-verify-connected-workspace.png)

## Connect an S3 repository

1. Open the repository connection dialog.
2. Switch repository type to **S3**.
3. Enter bucket, region, optional prefix, and AWS credentials.
4. Connect and use sync from the status bar.

![Switch to S3 tab](images/connect-s3-step-02-switch-to-s3-tab.png)
![S3 workspace connected](images/connect-s3-step-05-verify-s3-connected.png)

## Use local mode and stay offline

Use the local provider when you want files to stay on your machine only.

![Local workspace connected](images/local-workspace-step-02-connected-local-workspace.png)

## Tutorial screenshots used in this guide

This guide reuses screenshots from the built-in tutorials.

![First launch screen](images/create-repo-step-01-welcome-screen.png)
![Open repository dialog](images/create-repo-step-02-open-connect-dialog.png)
`;

export interface EnsureDefaultLocalRepoOptions {
  tutorialsRootDir: string | null;
  integrationTestMode: boolean;
}

export class DefaultLocalRepoBootstrapService {
  constructor(
    private readonly fsAdapter: FsAdapter,
    private readonly configService: ConfigService,
  ) {}

  async ensureDefaultLocalRepo(
    options: EnsureDefaultLocalRepoOptions,
  ): Promise<void> {
    if (options.integrationTestMode) {
      logger.debug("Skipping default local repo bootstrap in integration mode");
      return;
    }

    await this.configService.ensureConfigDir();
    await this.configService.migrateToProfiles();

    const profiles = await this.configService.getProfiles();
    const activeProfileId = await this.configService.getActiveProfileId();
    if (profiles.length > 0 || activeProfileId) {
      return;
    }

    const reposBaseDir = getDefaultReposBaseDir();
    await this.fsAdapter.mkdir(reposBaseDir, { recursive: true });

    const localPath = await this.resolveDefaultLocalPath(reposBaseDir);
    await this.fsAdapter.mkdir(localPath, { recursive: true });
    await this.seedDefaultRepoFiles(localPath, options.tutorialsRootDir);

    const timestamp = Date.now();
    const defaultProfile: Profile = {
      id: DEFAULT_PROFILE_ID,
      name: DEFAULT_PROFILE_NAME,
      repoSettings: {
        provider: REPO_PROVIDERS.local,
        localPath,
      },
      createdAt: timestamp,
      lastUsedAt: timestamp,
    };

    await this.configService.saveProfiles([defaultProfile]);
    await this.configService.setActiveProfileId(defaultProfile.id);

    logger.info("Created first-install default local repository profile", {
      profileId: DEFAULT_PROFILE_ID,
      localPath,
    });
  }

  private async resolveDefaultLocalPath(baseDir: string): Promise<string> {
    const preferredPath = path.join(baseDir, DEFAULT_REPO_DIR_NAME);
    if (!(await this.fsAdapter.exists(preferredPath))) {
      return preferredPath;
    }

    const stats = await this.fsAdapter.stat(preferredPath);
    if (stats.isDirectory()) {
      return preferredPath;
    }

    const fallbackFolderName = await findUniqueFolderName(
      baseDir,
      DEFAULT_REPO_DIR_NAME,
      this.fsAdapter,
    );
    return path.join(baseDir, fallbackFolderName);
  }

  private async seedDefaultRepoFiles(
    localPath: string,
    tutorialsRootDir: string | null,
  ): Promise<void> {
    const howToPath = path.join(localPath, HOW_TO_FILE_NAME);
    if (!(await this.fsAdapter.exists(howToPath))) {
      await this.fsAdapter.writeFile(howToPath, DEFAULT_HOW_TO_CONTENT);
    }

    const imagesDir = path.join(localPath, HOW_TO_IMAGES_DIR_NAME);
    await this.fsAdapter.mkdir(imagesDir, { recursive: true });

    if (!tutorialsRootDir) {
      logger.warn("Tutorial assets root not found, skipping image bootstrap");
      return;
    }

    for (const asset of TUTORIAL_IMAGE_ASSETS) {
      const sourcePath = path.join(tutorialsRootDir, asset.sourcePath);
      const targetPath = path.join(imagesDir, asset.targetFileName);

      if (await this.fsAdapter.exists(targetPath)) {
        continue;
      }

      if (!(await this.fsAdapter.exists(sourcePath))) {
        logger.warn("Tutorial image missing, skipping asset copy", {
          sourcePath,
          targetPath,
        });
        continue;
      }

      await this.fsAdapter.copyFile(sourcePath, targetPath);
    }
  }
}
