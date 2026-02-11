import type { SaveStatusType } from '../StatusBar/types';

export interface StatusBarSaveStatusProps {
  saveStatus: SaveStatusType;
  saveMessage?: string;
  savingLabel: string;
  savedLabel: string;
  errorLabel: string;
}
