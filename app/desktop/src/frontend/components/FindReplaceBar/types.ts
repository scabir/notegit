export type MatchInfo = { current: number; total: number };

export interface FindReplaceBarProps {
  onClose: () => void;
  onFindNext: (query: string) => void;
  onFindPrevious: (query: string) => void;
  onReplace: (query: string, replacement: string) => void;
  onReplaceAll: (query: string, replacement: string) => void;
  initialQuery?: string;
  matchInfo?: MatchInfo | null;
}
