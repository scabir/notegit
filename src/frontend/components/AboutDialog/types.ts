import type { SvgIconComponent } from '@mui/icons-material';

export interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export type TechStackItem = {
  label: string;
  icon?: SvgIconComponent;
};
