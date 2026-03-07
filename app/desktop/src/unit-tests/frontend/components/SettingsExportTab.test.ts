import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Alert, Button } from "@mui/material";
import { SettingsExportTab } from "../../../frontend/components/SettingsExportTab";
import { useI18n } from "../../../frontend/i18n";

jest.mock("../../../frontend/i18n", () => ({
  __esModule: true,
  useI18n: jest.fn(),
}));

const mockedUseI18n = useI18n as jest.MockedFunction<typeof useI18n>;

const renderComponent = (
  props: Partial<React.ComponentProps<typeof SettingsExportTab>> = {},
) => {
  const onExportNote = jest.fn();
  const onExportRepoAsZip = jest.fn();
  mockedUseI18n.mockReturnValue({
    ready: true,
    requestedLocale: "en-GB",
    locale: "en-GB",
    fallbackLocale: "en-GB",
    namespaces: [],
    validation: {
      missingKeys: [],
      extraKeys: [],
      typeMismatches: [],
      isValid: true,
    },
    t: (key: string) => key,
    has: () => true,
    reload: async () => {},
  });

  const renderer = TestRenderer.create(
    React.createElement(SettingsExportTab, {
      exporting: false,
      currentNoteContent: "# note",
      onExportNote,
      onExportRepoAsZip,
      ...props,
    }),
  );

  return { renderer, onExportNote, onExportRepoAsZip };
};

describe("SettingsExportTab", () => {
  it("exports note in markdown and text formats and exports repository zip", () => {
    const { renderer, onExportNote, onExportRepoAsZip } = renderComponent();
    const buttons = renderer.root.findAllByType(Button);

    act(() => {
      buttons[0].props.onClick();
      buttons[1].props.onClick();
      buttons[2].props.onClick();
    });

    expect(onExportNote).toHaveBeenNthCalledWith(1, "md");
    expect(onExportNote).toHaveBeenNthCalledWith(2, "txt");
    expect(onExportRepoAsZip).toHaveBeenCalledTimes(1);
  });

  it("shows open-note hint and disables note export when no note is open", () => {
    const { renderer } = renderComponent({ currentNoteContent: undefined });
    const alerts = renderer.root.findAllByType(Alert);
    const buttons = renderer.root.findAllByType(Button);

    expect(alerts.length).toBe(2);
    expect(buttons[0].props.disabled).toBe(true);
    expect(buttons[1].props.disabled).toBe(true);
    expect(buttons[2].props.disabled).toBe(false);
  });

  it("disables all export actions while exporting", () => {
    const { renderer } = renderComponent({ exporting: true });
    const buttons = renderer.root.findAllByType(Button);

    expect(buttons.every((button) => button.props.disabled)).toBe(true);
  });
});
