import { test, expect } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";
import * as path from "path";
import {
  cleanupUserDataDir,
  closeAppIfOpen,
  connectGitRepo,
  createIsolatedUserDataDir,
  getRepoInfo,
  launchIntegrationApp,
} from "../helpers/gitIntegration";

test("1) connect to git repo (happy path)", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectGitRepo(page);

    const repoInfo = await getRepoInfo(page);
    expect(repoInfo.provider).toBe("git");
    expect(
      path.resolve(repoInfo.localPath).startsWith(path.resolve(userDataDir)),
    ).toBe(true);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
