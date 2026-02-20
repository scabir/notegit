import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Button, TextField } from "@mui/material";
import { SettingsRepositoryTab } from "../../../frontend/components/SettingsRepositoryTab";
import { REPO_PROVIDERS } from "../../../shared/types";

const renderComponent = (
  props: Partial<React.ComponentProps<typeof SettingsRepositoryTab>> = {},
) => {
  const onRepoSettingsChange = jest.fn();
  const onSaveRepoSettings = jest.fn();
  const onCopyRepoPath = jest.fn();
  const onOpenRepoFolder = jest.fn();

  const renderer = TestRenderer.create(
    React.createElement(SettingsRepositoryTab, {
      repoProvider: REPO_PROVIDERS.git,
      repoSettings: {
        provider: REPO_PROVIDERS.git,
        localPath: "/repo",
      },
      gitRepoSettings: {
        remoteUrl: "https://github.com/example/repo.git",
        branch: "main",
        pat: "token",
      },
      s3RepoSettings: {
        bucket: "bucket",
        region: "us-east-1",
        prefix: "notes/",
        accessKeyId: "key",
        secretAccessKey: "secret",
        sessionToken: "",
      },
      loading: false,
      onRepoSettingsChange,
      onSaveRepoSettings,
      onCopyRepoPath,
      onOpenRepoFolder,
      ...props,
    }),
  );

  return {
    renderer,
    onRepoSettingsChange,
    onSaveRepoSettings,
    onCopyRepoPath,
    onOpenRepoFolder,
  };
};

const findTextFieldByLabel = (
  renderer: TestRenderer.ReactTestRenderer,
  label: string,
) =>
  renderer.root
    .findAllByType(TextField)
    .find((field: any) => field.props.label === label);

const findButtonByText = (
  renderer: TestRenderer.ReactTestRenderer,
  text: string,
) =>
  renderer.root.findAllByType(Button).find((button) => {
    const children = button.props.children;
    if (typeof children === "string") {
      return children === text;
    }
    if (Array.isArray(children)) {
      return children.includes(text);
    }
    return false;
  });

describe("SettingsRepositoryTab", () => {
  it("renders git settings and triggers handlers", () => {
    const {
      renderer,
      onRepoSettingsChange,
      onSaveRepoSettings,
      onCopyRepoPath,
      onOpenRepoFolder,
    } = renderComponent();

    const typeField = findTextFieldByLabel(renderer, "Repository Type");
    expect(typeField?.props.value).toBe("Git");

    const remoteUrlField = findTextFieldByLabel(renderer, "Remote URL");
    const branchField = findTextFieldByLabel(renderer, "Branch");
    const patField = findTextFieldByLabel(renderer, "Personal Access Token");
    const localPathField = findTextFieldByLabel(renderer, "Local Path");

    if (!remoteUrlField || !branchField || !patField || !localPathField) {
      throw new Error("Expected git fields were not found");
    }

    act(() => {
      remoteUrlField.props.onChange({
        target: { value: "https://github.com/example/updated.git" },
      });
      branchField.props.onChange({ target: { value: "develop" } });
      patField.props.onChange({ target: { value: "new-token" } });
      localPathField.props.onClick();
    });

    const saveButton = findButtonByText(renderer, "Save Repository Settings");
    const copyButton = findButtonByText(renderer, "Copy Path");
    const openButton = findButtonByText(renderer, "Open Folder");

    if (!saveButton || !copyButton || !openButton) {
      throw new Error("Expected repository action buttons not found");
    }

    act(() => {
      saveButton.props.onClick();
      copyButton.props.onClick();
      openButton.props.onClick();
    });

    expect(onSaveRepoSettings).toHaveBeenCalledTimes(1);
    expect(onCopyRepoPath).toHaveBeenCalledTimes(1);
    expect(onOpenRepoFolder).toHaveBeenCalledTimes(2);

    expect(onRepoSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: REPO_PROVIDERS.git,
        remoteUrl: "https://github.com/example/updated.git",
      }),
    );
    expect(onRepoSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: REPO_PROVIDERS.git,
        branch: "develop",
      }),
    );
    expect(onRepoSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: REPO_PROVIDERS.git,
        pat: "new-token",
      }),
    );
  });

  it("renders s3 settings, handles all changes, and respects loading state", () => {
    const { renderer, onRepoSettingsChange } = renderComponent({
      repoProvider: REPO_PROVIDERS.s3,
      loading: true,
      repoSettings: {
        provider: REPO_PROVIDERS.s3,
      },
    });

    const typeField = findTextFieldByLabel(renderer, "Repository Type");
    expect(typeField?.props.value).toBe("S3");

    const bucketField = findTextFieldByLabel(renderer, "Bucket");
    const regionField = findTextFieldByLabel(renderer, "Region");
    const prefixField = findTextFieldByLabel(renderer, "Prefix (optional)");
    const accessKeyField = findTextFieldByLabel(renderer, "Access Key ID");
    const secretField = findTextFieldByLabel(renderer, "Secret Access Key");
    const sessionField = findTextFieldByLabel(
      renderer,
      "Session Token (optional)",
    );

    if (
      !bucketField ||
      !regionField ||
      !prefixField ||
      !accessKeyField ||
      !secretField ||
      !sessionField
    ) {
      throw new Error("Expected S3 fields were not found");
    }

    act(() => {
      bucketField.props.onChange({ target: { value: "bucket-2" } });
      regionField.props.onChange({ target: { value: "eu-west-1" } });
      prefixField.props.onChange({ target: { value: "docs/" } });
      accessKeyField.props.onChange({ target: { value: "key-2" } });
      secretField.props.onChange({ target: { value: "secret-2" } });
      sessionField.props.onChange({ target: { value: "session-2" } });
    });

    const saveButton = findButtonByText(renderer, "Save Repository Settings");
    if (!saveButton) {
      throw new Error("Save Repository Settings button not found");
    }

    expect(saveButton.props.disabled).toBe(true);

    expect(onRepoSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: REPO_PROVIDERS.s3,
        bucket: "bucket-2",
      }),
    );
    expect(onRepoSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: REPO_PROVIDERS.s3,
        region: "eu-west-1",
      }),
    );
    expect(onRepoSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: REPO_PROVIDERS.s3,
        prefix: "docs/",
      }),
    );
    expect(onRepoSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: REPO_PROVIDERS.s3,
        accessKeyId: "key-2",
      }),
    );
    expect(onRepoSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: REPO_PROVIDERS.s3,
        secretAccessKey: "secret-2",
      }),
    );
    expect(onRepoSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: REPO_PROVIDERS.s3,
        sessionToken: "session-2",
      }),
    );
  });

  it("renders local repository mode without sync controls", () => {
    const { renderer } = renderComponent({
      repoProvider: REPO_PROVIDERS.local,
      repoSettings: {
        provider: REPO_PROVIDERS.local,
      },
    });

    const typeField = findTextFieldByLabel(renderer, "Repository Type");
    expect(typeField?.props.value).toBe("Local");

    const saveButton = findButtonByText(renderer, "Save Repository Settings");
    const copyButton = findButtonByText(renderer, "Copy Path");
    const openButton = findButtonByText(renderer, "Open Folder");

    expect(saveButton).toBeUndefined();
    expect(copyButton).toBeUndefined();
    expect(openButton).toBeUndefined();

    const text = JSON.stringify(renderer.toJSON());
    expect(text).toContain(
      "Local repositories are stored on this device only and do not sync",
    );
  });

  it("uses empty-string fallbacks when git or s3 values are missing", () => {
    const git = renderComponent({
      repoProvider: REPO_PROVIDERS.git,
      repoSettings: { provider: REPO_PROVIDERS.git },
      gitRepoSettings: {},
      s3RepoSettings: {},
    });

    expect(findTextFieldByLabel(git.renderer, "Remote URL")?.props.value).toBe(
      "",
    );
    expect(findTextFieldByLabel(git.renderer, "Branch")?.props.value).toBe("");
    expect(
      findTextFieldByLabel(git.renderer, "Personal Access Token")?.props.value,
    ).toBe("");

    const s3 = renderComponent({
      repoProvider: REPO_PROVIDERS.s3,
      repoSettings: { provider: REPO_PROVIDERS.s3 },
      gitRepoSettings: {},
      s3RepoSettings: {},
    });

    expect(findTextFieldByLabel(s3.renderer, "Bucket")?.props.value).toBe("");
    expect(findTextFieldByLabel(s3.renderer, "Region")?.props.value).toBe("");
    expect(
      findTextFieldByLabel(s3.renderer, "Prefix (optional)")?.props.value,
    ).toBe("");
    expect(
      findTextFieldByLabel(s3.renderer, "Access Key ID")?.props.value,
    ).toBe("");
    expect(
      findTextFieldByLabel(s3.renderer, "Secret Access Key")?.props.value,
    ).toBe("");
    expect(
      findTextFieldByLabel(s3.renderer, "Session Token (optional)")?.props
        .value,
    ).toBe("");
  });
});
