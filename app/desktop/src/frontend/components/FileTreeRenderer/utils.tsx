import React from "react";
import {
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  TextSnippet as TextIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";
import type { FileType } from "../../../shared/types";

export const getFileIcon = (fileType?: FileType) => {
  switch (fileType) {
    case "markdown":
      return <DescriptionIcon fontSize="small" sx={{ color: "#1976d2" }} />;
    case "image":
      return <ImageIcon fontSize="small" sx={{ color: "#f50057" }} />;
    case "pdf":
      return <PdfIcon fontSize="small" sx={{ color: "#d32f2f" }} />;
    case "code":
      return <CodeIcon fontSize="small" sx={{ color: "#388e3c" }} />;
    case "text":
      return <TextIcon fontSize="small" sx={{ color: "#757575" }} />;
    case "json":
      return <CodeIcon fontSize="small" sx={{ color: "#ff9800" }} />;
    default:
      return <FileIcon fontSize="small" sx={{ color: "#757575" }} />;
  }
};
