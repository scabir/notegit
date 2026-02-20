import React from "react";
import { Typography } from "@mui/material";
import { STATUS_BAR_BRANCH_LABEL } from "./constants";
import { branchLabelSx } from "./styles";
import type { StatusBarBranchLabelProps } from "./types";

export function StatusBarBranchLabel({
  isLocal,
  hasStatus,
  isS3,
  branchName,
  bucketLabel,
  branchLabel,
}: StatusBarBranchLabelProps) {
  if (isLocal || !hasStatus) {
    return null;
  }

  return (
    <Typography
      variant="body2"
      sx={branchLabelSx}
      data-testid={STATUS_BAR_BRANCH_LABEL.testId}
    >
      {isS3 ? bucketLabel : branchLabel}: <strong>{branchName}</strong>
    </Typography>
  );
}
