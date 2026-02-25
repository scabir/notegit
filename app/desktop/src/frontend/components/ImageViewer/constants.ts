import { getDefaultTranslation } from "../../i18n/defaultTranslations";

type TranslateFn = (key: string) => string;

export const IMAGE_VIEWER_KEYS = {
  emptyState: "imageViewer.emptyState",
  imagePreviewAlt: "imageViewer.imagePreviewAlt",
  showTreeTooltip: "imageViewer.showTreeTooltip",
  backTooltip: "imageViewer.backTooltip",
  forwardTooltip: "imageViewer.forwardTooltip",
} as const;

const defaultText = (key: string): string => getDefaultTranslation(key);

export const buildImageViewerText = (t: TranslateFn) => ({
  emptyState: t(IMAGE_VIEWER_KEYS.emptyState),
  imagePreviewAlt: t(IMAGE_VIEWER_KEYS.imagePreviewAlt),
  showTreeTooltip: t(IMAGE_VIEWER_KEYS.showTreeTooltip),
  backTooltip: t(IMAGE_VIEWER_KEYS.backTooltip),
  forwardTooltip: t(IMAGE_VIEWER_KEYS.forwardTooltip),
});

export const IMAGE_VIEWER_TEXT = {
  emptyState: defaultText(IMAGE_VIEWER_KEYS.emptyState),
  imagePreviewAlt: defaultText(IMAGE_VIEWER_KEYS.imagePreviewAlt),
  showTreeTooltip: defaultText(IMAGE_VIEWER_KEYS.showTreeTooltip),
  backTooltip: defaultText(IMAGE_VIEWER_KEYS.backTooltip),
  forwardTooltip: defaultText(IMAGE_VIEWER_KEYS.forwardTooltip),
} as const;
