import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { IconButton, Tooltip } from "@mui/material";
import { ImageViewer } from "../../../frontend/components/ImageViewer";
import { IMAGE_VIEWER_TEXT } from "../../../frontend/components/ImageViewer/constants";
import { FileType } from "../../../shared/types";

const flattenText = (node: any): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(flattenText).join("");
  return node.children ? node.children.map(flattenText).join("") : "";
};

const findToolbarButton = (
  renderer: TestRenderer.ReactTestRenderer,
  title: string,
) => {
  const tooltip = renderer.root
    .findAllByType(Tooltip)
    .find((item) => item.props.title === title);

  if (!tooltip) {
    throw new Error(`Tooltip not found: ${title}`);
  }

  return tooltip.findByType(IconButton);
};

describe("ImageViewer", () => {
  it("renders empty state when no file is selected", () => {
    const renderer = TestRenderer.create(
      React.createElement(ImageViewer, {
        file: null,
        repoPath: "/repo",
      }),
    );

    expect(flattenText(renderer.toJSON())).toContain(
      IMAGE_VIEWER_TEXT.emptyState,
    );
  });

  it("renders selected image with repo-based file URL", () => {
    const renderer = TestRenderer.create(
      React.createElement(ImageViewer, {
        file: {
          path: "assets/photo.jpg",
          content: "binary-data",
          type: FileType.IMAGE,
        },
        repoPath: "/repo",
      }),
    );

    const image = renderer.root.findByType("img");
    expect(image.props.src).toBe("file:///repo/assets/photo.jpg");
    expect(image.props.alt).toBe("assets/photo.jpg");
  });

  it("normalizes windows paths when building image URL", () => {
    const renderer = TestRenderer.create(
      React.createElement(ImageViewer, {
        file: {
          path: "\\assets\\photo one.jpg",
          content: "binary-data",
          type: FileType.IMAGE,
        },
        repoPath: "C:\\repo\\notes\\",
      }),
    );

    const image = renderer.root.findByType("img");
    expect(image.props.src).toBe(
      "file:///C:/repo/notes/assets/photo%20one.jpg",
    );
  });

  it("renders an empty image src when repo path is missing", () => {
    const renderer = TestRenderer.create(
      React.createElement(ImageViewer, {
        file: {
          path: "assets/photo.jpg",
          content: "binary-data",
          type: FileType.IMAGE,
        },
        repoPath: null,
      }),
    );

    const image = renderer.root.findByType("img");
    expect(image.props.src).toBe("");
  });

  it("shows tree controls and wires callbacks", () => {
    const onToggleTree = jest.fn();
    const onNavigateBack = jest.fn();
    const onNavigateForward = jest.fn();
    const renderer = TestRenderer.create(
      React.createElement(ImageViewer, {
        file: {
          path: "assets/photo.jpg",
          content: "binary-data",
          type: FileType.IMAGE,
        },
        repoPath: "/repo",
        treePanelControls: {
          onToggleTree,
          onNavigateBack,
          onNavigateForward,
          canNavigateBack: true,
          canNavigateForward: false,
        },
      }),
    );

    const showTreeButton = findToolbarButton(
      renderer,
      IMAGE_VIEWER_TEXT.showTreeTooltip,
    );
    const backButton = findToolbarButton(
      renderer,
      IMAGE_VIEWER_TEXT.backTooltip,
    );
    const forwardButton = findToolbarButton(
      renderer,
      IMAGE_VIEWER_TEXT.forwardTooltip,
    );

    act(() => {
      showTreeButton.props.onClick();
      backButton.props.onClick();
    });

    expect(forwardButton.props.disabled).toBe(true);
    expect(onToggleTree).toHaveBeenCalledTimes(1);
    expect(onNavigateBack).toHaveBeenCalledTimes(1);
    expect(onNavigateForward).not.toHaveBeenCalled();
  });
});
