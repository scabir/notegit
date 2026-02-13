import { test, expect } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";
import * as fs from "fs/promises";
import * as path from "path";
import {
  appendToCurrentEditor,
  cleanupUserDataDir,
  closeAppIfOpen,
  commitAndPushAll,
  connectGitRepo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  getRepoInfo,
  getRepoStatus,
  launchIntegrationApp,
} from "../helpers/gitIntegration";

test("2) create file, edit content, commit and push", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectGitRepo(page);
    await createMarkdownFile(page, "integration-note.md");
    await appendToCurrentEditor(page, "\nIntegration test content\n");
    await commitAndPushAll(page);

    await expect
      .poll(async () => {
        const status = await getRepoStatus(page);
        return status.ahead;
      })
      .toBe(0);

    const repoInfo = await getRepoInfo(page);
    await fs.access(path.join(repoInfo.localPath, "integration-note.md"));
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
