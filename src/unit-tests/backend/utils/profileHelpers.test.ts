import * as path from "path";
import { app } from "electron";
import {
  slugifyProfileName,
  getDefaultReposBaseDir,
  extractRepoNameFromUrl,
  findUniqueFolderName,
} from "../../../backend/utils/profileHelpers";

describe("profileHelpers", () => {
  it("slugifies profile names and falls back to repo", () => {
    expect(slugifyProfileName("My Notes Repo")).toBe("my-notes-repo");
    expect(slugifyProfileName("  ###  ")).toBe("repo");
  });

  it("builds the default repos base dir from userData", () => {
    const expected = path.join(app.getPath("userData"), "repos");
    expect(getDefaultReposBaseDir()).toBe(expected);
  });

  it("extracts repository names from URLs", () => {
    expect(extractRepoNameFromUrl("https://github.com/user/repo.git")).toBe(
      "repo",
    );
    expect(extractRepoNameFromUrl("git@github.com:user/repo.git")).toBe("repo");
    expect(extractRepoNameFromUrl("https://example.com/group/project")).toBe(
      "project",
    );
  });

  it("returns repo on invalid URLs", () => {
    expect(extractRepoNameFromUrl("")).toBe("repo");
    expect(extractRepoNameFromUrl(null as unknown as string)).toBe("repo");
  });

  it("finds a unique folder name when base exists", async () => {
    const exists = jest
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const name = await findUniqueFolderName("/base", "notes", { exists });

    expect(name).toBe("notes-1");
  });
});
