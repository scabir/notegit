import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Button } from "@mui/material";
import { FavoritesBar } from "../../../frontend/components/FileTreeFavoritesBar";

describe("FavoritesBar", () => {
  it("renders nothing when there are no favorites", () => {
    const renderer = TestRenderer.create(
      React.createElement(FavoritesBar, {
        title: "Favorites",
        favorites: [],
        onSelect: jest.fn(),
        onContextMenu: jest.fn(),
      }),
    );

    expect(renderer.toJSON()).toBeNull();
  });

  it("renders favorites and handles click/context menu events", () => {
    const onSelect = jest.fn();
    const onContextMenu = jest.fn();
    const favorite = {
      id: "1",
      name: "notes.md",
      path: "notes.md",
      type: "file",
      children: [],
    };

    const renderer = TestRenderer.create(
      React.createElement(FavoritesBar, {
        title: "Favorites",
        favorites: [favorite as any],
        onSelect,
        onContextMenu,
      }),
    );

    const button = renderer.root.findByType(Button);
    const fakeEvent = {} as React.MouseEvent<HTMLElement>;

    act(() => {
      button.props.onClick();
      button.props.onContextMenu(fakeEvent);
    });

    expect(onSelect).toHaveBeenCalledWith(favorite);
    expect(onContextMenu).toHaveBeenCalledWith(fakeEvent, "notes.md");
  });
});
