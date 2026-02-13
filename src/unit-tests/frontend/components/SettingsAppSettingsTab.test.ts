import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Button, Select, Switch, TextField } from "@mui/material";
import { SettingsAppSettingsTab } from "../../../frontend/components/SettingsAppSettingsTab";
import { REPO_PROVIDERS } from "../../../shared/types";
import type { AppSettings } from "../../../shared/types";

const baseAppSettings: AppSettings = {
  autoSaveEnabled: false,
  autoSaveIntervalSec: 30,
  s3AutoSyncEnabled: true,
  s3AutoSyncIntervalSec: 60,
  theme: "system",
  editorPrefs: {
    fontSize: 14,
    lineNumbers: true,
    tabSize: 2,
    showPreview: true,
  },
};

const renderComponent = (
  props: Partial<React.ComponentProps<typeof SettingsAppSettingsTab>> = {},
) => {
  const onAppSettingsChange = jest.fn();
  const onSaveAppSettings = jest.fn();

  const renderer = TestRenderer.create(
    React.createElement(SettingsAppSettingsTab, {
      appSettings: baseAppSettings,
      repoProvider: REPO_PROVIDERS.git,
      loading: false,
      onAppSettingsChange,
      onSaveAppSettings,
      ...props,
    }),
  );

  return { renderer, onAppSettingsChange, onSaveAppSettings };
};

const findTextFieldByLabel = (
  renderer: TestRenderer.ReactTestRenderer,
  label: string,
) =>
  renderer.root
    .findAllByType(TextField)
    .find((field: any) => field.props.label === label);

describe("SettingsAppSettingsTab", () => {
  it("renders nothing when app settings are unavailable", () => {
    const { renderer } = renderComponent({ appSettings: null });
    expect(renderer.toJSON()).toBeNull();
  });

  it("renders app settings controls and updates values for git repositories", () => {
    const { renderer, onAppSettingsChange, onSaveAppSettings } =
      renderComponent();

    expect(
      findTextFieldByLabel(renderer, "Auto-save Interval (seconds)"),
    ).toBeUndefined();
    expect(
      findTextFieldByLabel(renderer, "S3 Auto Sync (in seconds)"),
    ).toBeUndefined();

    const themeSelect = renderer.root.findByType(Select);
    act(() => {
      themeSelect.props.onChange({ target: { value: "light" } });
    });

    const switches = renderer.root.findAllByType(Switch);
    expect(switches.length).toBe(3);

    act(() => {
      switches[0].props.onChange({ target: { checked: true } });
      switches[1].props.onChange({ target: { checked: false } });
      switches[2].props.onChange({ target: { checked: false } });
    });

    const fontSizeField = findTextFieldByLabel(renderer, "Font Size");
    const tabSizeField = findTextFieldByLabel(renderer, "Tab Size");
    if (!fontSizeField || !tabSizeField) {
      throw new Error("Expected editor preference fields to be present");
    }

    act(() => {
      fontSizeField.props.onChange({ target: { value: "16" } });
      tabSizeField.props.onChange({ target: { value: "4" } });
    });

    const saveButton = renderer.root
      .findAllByType(Button)
      .find((button) => button.props.children === "Save App Settings");
    if (!saveButton) {
      throw new Error("Save App Settings button not found");
    }

    act(() => {
      saveButton.props.onClick();
    });

    expect(onSaveAppSettings).toHaveBeenCalledTimes(1);

    expect(onAppSettingsChange).toHaveBeenCalledWith({
      ...baseAppSettings,
      theme: "light",
    });
    expect(onAppSettingsChange).toHaveBeenCalledWith({
      ...baseAppSettings,
      autoSaveEnabled: true,
    });
    expect(onAppSettingsChange).toHaveBeenCalledWith({
      ...baseAppSettings,
      editorPrefs: {
        ...baseAppSettings.editorPrefs,
        lineNumbers: false,
      },
    });
    expect(onAppSettingsChange).toHaveBeenCalledWith({
      ...baseAppSettings,
      editorPrefs: {
        ...baseAppSettings.editorPrefs,
        showPreview: false,
      },
    });
    expect(onAppSettingsChange).toHaveBeenCalledWith({
      ...baseAppSettings,
      editorPrefs: {
        ...baseAppSettings.editorPrefs,
        fontSize: 16,
      },
    });
    expect(onAppSettingsChange).toHaveBeenCalledWith({
      ...baseAppSettings,
      editorPrefs: {
        ...baseAppSettings.editorPrefs,
        tabSize: 4,
      },
    });
  });

  it("shows S3-specific controls and handles S3 changes", () => {
    const { renderer, onAppSettingsChange } = renderComponent({
      repoProvider: REPO_PROVIDERS.s3,
      appSettings: {
        ...baseAppSettings,
        autoSaveEnabled: true,
        s3AutoSyncEnabled: true,
      },
      loading: true,
    });

    const autoSaveField = findTextFieldByLabel(
      renderer,
      "Auto-save Interval (seconds)",
    );
    const s3AutoSyncField = findTextFieldByLabel(
      renderer,
      "S3 Auto Sync (in seconds)",
    );
    if (!autoSaveField || !s3AutoSyncField) {
      throw new Error("Expected autosave and s3 autosync fields to be present");
    }

    act(() => {
      autoSaveField.props.onChange({ target: { value: "45" } });
      s3AutoSyncField.props.onChange({ target: { value: "120" } });
    });

    const switches = renderer.root.findAllByType(Switch);
    expect(switches.length).toBe(4);

    act(() => {
      switches[1].props.onChange({ target: { checked: false } });
    });

    const saveButton = renderer.root
      .findAllByType(Button)
      .find((button) => button.props.children === "Save App Settings");
    if (!saveButton) {
      throw new Error("Save App Settings button not found");
    }

    expect(saveButton.props.disabled).toBe(true);

    expect(onAppSettingsChange).toHaveBeenCalledWith({
      ...baseAppSettings,
      autoSaveEnabled: true,
      s3AutoSyncEnabled: true,
      autoSaveIntervalSec: 45,
    });
    expect(onAppSettingsChange).toHaveBeenCalledWith({
      ...baseAppSettings,
      autoSaveEnabled: true,
      s3AutoSyncEnabled: true,
      s3AutoSyncIntervalSec: 120,
    });
    expect(onAppSettingsChange).toHaveBeenCalledWith({
      ...baseAppSettings,
      autoSaveEnabled: true,
      s3AutoSyncEnabled: false,
    });
  });
});
