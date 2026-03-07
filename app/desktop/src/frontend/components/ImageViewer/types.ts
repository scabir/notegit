import type { FileContent } from "../../../shared/types";

export type TreePanelControls = {
  onToggleTree: () => void;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
};

export interface ImageViewerProps {
  file: FileContent | null;
  repoPath: string | null;
  treePanelControls?: TreePanelControls;
}
