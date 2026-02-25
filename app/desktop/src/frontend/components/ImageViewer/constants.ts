import enGbImageViewer from "../../i18n/en-GB/imageViewer.json";

type TranslateFn = (key: string) => string;

export const IMAGE_VIEWER_KEYS = {
  emptyState: "imageViewer.emptyState",
  imagePreviewAlt: "imageViewer.imagePreviewAlt",
  showTreeTooltip: "imageViewer.showTreeTooltip",
  backTooltip: "imageViewer.backTooltip",
  forwardTooltip: "imageViewer.forwardTooltip",
} as const;

export const buildImageViewerText = (t: TranslateFn) => ({
  emptyState: t(IMAGE_VIEWER_KEYS.emptyState),
  imagePreviewAlt: t(IMAGE_VIEWER_KEYS.imagePreviewAlt),
  showTreeTooltip: t(IMAGE_VIEWER_KEYS.showTreeTooltip),
  backTooltip: t(IMAGE_VIEWER_KEYS.backTooltip),
  forwardTooltip: t(IMAGE_VIEWER_KEYS.forwardTooltip),
});

export const IMAGE_VIEWER_TEXT = {
  emptyState: enGbImageViewer.emptyState,
  imagePreviewAlt: enGbImageViewer.imagePreviewAlt,
  showTreeTooltip: enGbImageViewer.showTreeTooltip,
  backTooltip: enGbImageViewer.backTooltip,
  forwardTooltip: enGbImageViewer.forwardTooltip,
} as const;
