import { test, expect } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";
import {
  appendToCurrentEditor,
  cleanupUserDataDir,
  closeAppIfOpen,
  commitAndPushAll,
  connectGitRepo,
  createIsolatedUserDataDir,
  createMarkdownFile,
  getLatestCommitMessageForFile,
  getRepoStatus,
  launchIntegrationApp,
  saveCurrentFile,
  selectFileFromTree,
} from "../helpers/gitIntegration";

test("4) commit all from mixed changes (multiple files)", async ({
  request: _request,
}, testInfo) => {
  const userDataDir = await createIsolatedUserDataDir(testInfo);
  let app: ElectronApplication | null = null;

  try {
    const launched = await launchIntegrationApp(userDataDir);
    app = launched.app;
    const page = launched.page;

    await connectGitRepo(page);
    await createMarkdownFile(page, "mixed-a.md");
    await createMarkdownFile(page, "mixed-b.md");

    await selectFileFromTree(page, "mixed-a.md");
    await appendToCurrentEditor(
      page,
      "\nAdditional content for mixed file A\n",
    );
    await saveCurrentFile(page);

    await commitAndPushAll(page);

    const latestMessage = await getLatestCommitMessageForFile(
      page,
      "mixed-a.md",
    );
    expect(latestMessage).toContain("mixed-a.md");
    expect(latestMessage).toContain("mixed-b.md");

    const status = await getRepoStatus(page);
    expect(status.ahead).toBe(0);
    expect(status.hasUncommitted).toBe(false);
  } finally {
    await closeAppIfOpen(app);
    await cleanupUserDataDir(userDataDir);
  }
});
