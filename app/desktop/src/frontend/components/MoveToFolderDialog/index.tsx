import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { TreeView, TreeItem } from "@mui/x-tree-view";
import {
  Folder as FolderIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import type { FileTreeNode } from "../../../shared/types";
import { useI18n } from "../../i18n";
import { buildMoveDialogErrors, buildMoveDialogText } from "./constants";
import {
  infoBoxSx,
  errorAlertSx,
  sectionLabelSx,
  folderRowSx,
  folderIconSx,
  rootOptionSx,
  rootOptionInnerSx,
  treeContainerSx,
  emptyTreeTextSx,
} from "./styles";
import {
  isDescendant,
  collectFolders,
  getParentPath,
  getCurrentLocationLabel,
} from "./utils";
import type { MoveToFolderDialogProps } from "./types";

export function MoveToFolderDialog({
  open,
  onClose,
  onConfirm,
  itemToMove,
  tree,
}: MoveToFolderDialogProps) {
  const { t } = useI18n();
  const text = React.useMemo(() => buildMoveDialogText(t), [t]);
  const errors = React.useMemo(() => buildMoveDialogErrors(t), [t]);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>("");
  const [error, setError] = useState<string>("");

  React.useEffect(() => {
    if (open) {
      setSelectedFolderPath("");
      setError("");
    }
  }, [open]);

  const allFolders = collectFolders(tree);

  const renderFolderTree = (node: FileTreeNode): React.ReactNode => {
    if (node.type !== "folder") return null;

    const isInvalid = Boolean(
      itemToMove &&
      (node.id === itemToMove.id ||
        (itemToMove.type === "folder" &&
          isDescendant(itemToMove.path, node.path))),
    );

    return (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={
          <Box sx={folderRowSx(isInvalid)}>
            <FolderIcon fontSize="small" sx={folderIconSx} />
            <Typography variant="body2">{node.name}</Typography>
          </Box>
        }
        disabled={isInvalid}
      >
        {node.children
          ?.filter((child) => child.type === "folder")
          .map((child) => renderFolderTree(child))}
      </TreeItem>
    );
  };

  const handleConfirm = () => {
    if (!itemToMove) return;

    if (!selectedFolderPath && selectedFolderPath !== "") {
      setError(errors.selectDestination);
      return;
    }

    const currentParentPath = getParentPath(itemToMove.path);

    if (selectedFolderPath === currentParentPath) {
      setError(errors.sameLocation);
      return;
    }

    const destinationFolder = allFolders.find(
      (f) => f.path === selectedFolderPath,
    );
    if (
      destinationFolder?.children?.some(
        (child) => child.name === itemToMove.name,
      )
    ) {
      setError(errors.duplicateItem(itemToMove.name));
      return;
    }

    onConfirm(selectedFolderPath);
  };

  if (!itemToMove) return null;

  const currentLocation = getCurrentLocationLabel(
    itemToMove.path,
    text.rootFallback,
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{text.title}</DialogTitle>
      <DialogContent>
        <Box sx={infoBoxSx}>
          <Typography variant="body2" color="text.secondary">
            {text.movingLabel}: <strong>{itemToMove.name}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {text.currentLocationLabel}: <strong>{currentLocation}</strong>
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={errorAlertSx}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle2" sx={sectionLabelSx}>
          {text.selectDestination}
        </Typography>

        <Box
          onClick={() => {
            setSelectedFolderPath("");
            setError("");
          }}
          sx={rootOptionSx(selectedFolderPath === "")}
        >
          <Box sx={rootOptionInnerSx}>
            <FolderIcon fontSize="small" sx={folderIconSx} />
            <Typography variant="body2">{text.rootLabel}</Typography>
          </Box>
        </Box>

        <Box sx={treeContainerSx}>
          {allFolders.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={emptyTreeTextSx}
            >
              {text.noFolders}
            </Typography>
          ) : (
            <TreeView
              defaultCollapseIcon={<ExpandMoreIcon />}
              defaultExpandIcon={<ChevronRightIcon />}
              selected={selectedFolderPath}
              onNodeSelect={(_event: React.SyntheticEvent, nodeId: string) => {
                const folder = allFolders.find((f) => f.id === nodeId);
                if (folder) {
                  const isInvalid =
                    itemToMove &&
                    (folder.id === itemToMove.id ||
                      (itemToMove.type === "folder" &&
                        isDescendant(itemToMove.path, folder.path)));

                  if (!isInvalid) {
                    setSelectedFolderPath(folder.path);
                    setError("");
                  }
                }
              }}
            >
              {tree
                .filter((node) => node.type === "folder")
                .map((node) => renderFolderTree(node))}
            </TreeView>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{text.cancel}</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedFolderPath && selectedFolderPath !== ""}
        >
          {text.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
