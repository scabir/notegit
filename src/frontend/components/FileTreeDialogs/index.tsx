import React from 'react';
import { Box } from '@mui/material';
import { DialogCreateItem } from '../FileTreeDialogCreateItem';
import { DialogRename } from '../FileTreeDialogRename';
import { MoveToFolderDialog } from '../MoveToFolderDialog';
import { FILE_TREE_DIALOGS_IDS } from './constants';
import { dialogsContainerSx } from './styles';
import type { FileTreeDialogsProps } from './types';

export function FileTreeDialogs({
  text,
  tree,
  selectedNode,
  createFileDialogOpen,
  createFolderDialogOpen,
  renameDialogOpen,
  moveDialogOpen,
  newItemName,
  creating,
  errorMessage,
  creationLocationText,
  fileHelperText,
  onSetName,
  onClearError,
  onCloseCreateFileDialog,
  onCloseCreateFolderDialog,
  onCloseRenameDialog,
  onCloseMoveDialog,
  onCreateFile,
  onCreateFolder,
  onRename,
  onMoveToFolder,
}: FileTreeDialogsProps) {
  return (
    <Box sx={dialogsContainerSx}>
      <DialogCreateItem
        testId={FILE_TREE_DIALOGS_IDS.createFile}
        open={createFileDialogOpen}
        title={text.createFileTitle}
        label={text.fileNameLabel}
        helperText={fileHelperText}
        placeholder={text.filePlaceholder}
        creationLocationText={creationLocationText}
        value={newItemName}
        errorMessage={errorMessage}
        creating={creating}
        onChange={(value) => {
          onSetName(value);
          onClearError();
        }}
        onClose={() => {
          onCloseCreateFileDialog();
          onClearError();
        }}
        onCreate={onCreateFile}
        cancelLabel={text.cancel}
        confirmLabel={text.create}
        loadingLabel={text.creating}
      />

      <DialogCreateItem
        testId={FILE_TREE_DIALOGS_IDS.createFolder}
        open={createFolderDialogOpen}
        title={text.createFolderTitle}
        label={text.folderNameLabel}
        placeholder={text.folderPlaceholder}
        creationLocationText={creationLocationText}
        value={newItemName}
        errorMessage={errorMessage}
        creating={creating}
        onChange={(value) => {
          onSetName(value);
          onClearError();
        }}
        onClose={() => {
          onCloseCreateFolderDialog();
          onClearError();
        }}
        onCreate={onCreateFolder}
        cancelLabel={text.cancel}
        confirmLabel={text.create}
        loadingLabel={text.creating}
      />

      <DialogRename
        testId={FILE_TREE_DIALOGS_IDS.rename}
        open={renameDialogOpen}
        onClose={() => {
          onCloseRenameDialog();
          onClearError();
        }}
        title={selectedNode?.type === 'folder' ? text.renameFolderTitle : text.renameFileTitle}
        label={text.newNameLabel}
        value={newItemName}
        onChange={(value) => {
          onSetName(value);
          onClearError();
        }}
        onSubmit={onRename}
        errorMessage={errorMessage}
        creating={creating}
        placeholder={selectedNode?.name || ''}
        cancelLabel={text.cancel}
        confirmLabel={text.renameAction}
        loadingLabel={text.renaming}
      />

      <MoveToFolderDialog
        open={moveDialogOpen}
        onClose={onCloseMoveDialog}
        onConfirm={onMoveToFolder}
        itemToMove={selectedNode}
        tree={tree}
      />
    </Box>
  );
}
