import type { FileContent } from "../../../shared/types";

export interface TreePanelControls {
  onToggleTree: () => void;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
}

export interface TextEditorProps {
  file: FileContent | null;
  onSave: (content: string) => void;
  onChange: (content: string, hasChanges: boolean) => void;
  treePanelControls?: TreePanelControls;
}
