import React from "react";
import { renderToString } from "react-dom/server";
import { StatusBarUncommittedChip } from "../../../frontend/components/StatusBarUncommittedChip";
import { REPO_PROVIDERS } from "../../../shared/types";

const baseStatus = {
  provider: REPO_PROVIDERS.git,
  branch: "main",
  ahead: 0,
  behind: 0,
  hasUncommitted: true,
  pendingPushCount: 0,
  needsPull: false,
};

const renderChip = (
  props: Partial<React.ComponentProps<typeof StatusBarUncommittedChip>> = {},
) =>
  renderToString(
    React.createElement(StatusBarUncommittedChip, {
      status: baseStatus,
      isLocal: false,
      isS3: false,
      unsyncedLabel: "Unsynced changes",
      uncommittedLabel: "Uncommitted changes",
      ...props,
    }),
  );

describe("StatusBarUncommittedChip", () => {
  it("does not render when status is missing, local, clean, or already represented", () => {
    expect(renderChip({ status: null })).toBe("");
    expect(renderChip({ isLocal: true })).toBe("");
    expect(
      renderChip({ status: { ...baseStatus, hasUncommitted: false } }),
    ).toBe("");
    expect(renderChip({ syncStatusLabel: "Uncommitted changes" })).toBe("");
  });

  it("renders git label when uncommitted changes are present", () => {
    const html = renderChip();
    expect(html).toContain("Uncommitted changes");
    expect(html).toContain("status-bar-uncommitted-chip");
  });

  it("renders s3 unsynced label when applicable", () => {
    const html = renderChip({ isS3: true });
    expect(html).toContain("Unsynced changes");
    expect(html).not.toContain("Uncommitted changes");
  });
});
