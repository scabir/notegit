import React from "react";
import { Box } from "@mui/material";
import {
  Description as FileIcon,
  TextSnippet as TextFileIcon,
} from "@mui/icons-material";
import { highlightSx } from "./styles";

export const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "md" || ext === "markdown") {
    return <FileIcon sx={{ color: "#1976d2" }} />;
  }
  return <TextFileIcon sx={{ color: "#757575" }} />;
};

export const highlightMatch = (
  text: string,
  query: string,
  isDark: boolean,
) => {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <Box component="span" sx={highlightSx(isDark)}>
        {match}
      </Box>
      {after}
    </>
  );
};
