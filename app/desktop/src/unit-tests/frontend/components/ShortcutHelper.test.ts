jest.mock("@mui/material/Menu", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
  };
});

import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { IconButton, Menu } from "@mui/material";
import {
  ShortcutHelper,
  type ShortcutHelperHandle,
} from "../../../frontend/components/ShortcutHelper";

describe("ShortcutHelper", () => {
  it("opens the helper menu when the question mark button is clicked", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(React.createElement(ShortcutHelper));
    });
    const button = renderer!.root.findByType(IconButton);
    act(() => {
      button.props.onClick({ currentTarget: {} as HTMLElement });
    });

    const menu = renderer!.root.findByType(Menu);
    expect(menu.props.open).toBe(true);
  });

  it("opens the helper menu when openMenu is invoked through the ref", () => {
    const helperRef = React.createRef<ShortcutHelperHandle>();

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(ShortcutHelper, { ref: helperRef }),
      );
    });

    act(() => {
      helperRef.current?.openMenu();
    });

    const menu = renderer!.root.findByType(Menu);
    expect(menu.props.open).toBe(true);

    act(() => {
      menu.props.onClose();
    });

    expect(renderer!.root.findByType(Menu).props.open).toBe(false);
  });
});
