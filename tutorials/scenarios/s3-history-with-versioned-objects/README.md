# [S3] History with Versioned Objects

This scenario shows how S3 object versions appear in history after multiple syncs.

## Step 1: Start from connected S3 workspace

Connect to a versioned S3 bucket before creating multiple historical versions.

![Start from connected S3 workspace](images/step-01-connected-s3-workspace.png)

## Step 2: Create and sync multiple versions

Save and sync two revisions so S3 object version history is available.

![Create and sync multiple versions](images/step-02-create-and-sync-multiple-versions.png)

## Step 3: Open S3 history panel

Use the history action to view available S3 object versions for the selected file.

![Open S3 history panel](images/step-03-open-s3-history-panel.png)

## Step 4: Open versioned object content

Open a history entry to inspect that S3 object version in the read-only viewer.

![Open versioned object content](images/step-04-open-versioned-object-viewer.png)

## Step 5: Return to current working version

Close the history viewer and continue working on the current file version in the editor.

![Return to current working version](images/step-05-return-to-current-version.png)

## Versioning Notes

- S3 bucket versioning must be enabled to retain object history.
- S3 history viewer supports version inspection but not diff rendering.
