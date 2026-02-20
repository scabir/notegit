import type { TreePanelControls, ViewMode } from "../MarkdownEditor/types";

export interface MarkdownEditorHeaderProps {
  filePath: string;
  hasUnsavedChanges: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onSave: () => void;
  onExport: () => void;
  treePanelControls?: TreePanelControls;
}
