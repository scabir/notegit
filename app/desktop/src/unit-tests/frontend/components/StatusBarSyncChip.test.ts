import React from "react";
import TestRenderer from "react-test-renderer";
import { Chip } from "@mui/material";
import { StatusBarSyncChip } from "../../../frontend/components/StatusBarSyncChip";

describe("StatusBarSyncChip", () => {
  it("renders nothing when sync status is missing", () => {
    const renderer = TestRenderer.create(
      React.createElement(StatusBarSyncChip, {
        syncStatus: null,
      }),
    );

    expect(renderer.toJSON()).toBeNull();
  });

  it("renders the sync status chip", () => {
    const renderer = TestRenderer.create(
      React.createElement(StatusBarSyncChip, {
        syncStatus: {
          icon: React.createElement("span", null, "i"),
          label: "Synced",
          color: "success",
        },
      }),
    );

    const chip = renderer.root.findByType(Chip);
    expect(chip.props.label).toBe("Synced");
    expect(chip.props.color).toBe("success");
  });
});
