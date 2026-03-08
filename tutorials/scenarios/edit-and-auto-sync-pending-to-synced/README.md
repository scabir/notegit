# [S3] Edit and Auto Sync (Pending to Synced)

This scenario shows the S3 sync status transition from pending local changes to synced state.

## Step 1: Start from connected S3 workspace

Connect to S3 first so status bar sync actions and pending counters become available.

![Start from connected S3 workspace](images/step-01-connected-s3-workspace.png)

## Step 2: Create local S3 changes

Create local note changes first so S3 sync chip can transition from pending to synced.

![Create local S3 changes](images/step-02-edit-and-save-note.png)

## Step 3: Observe pending sync state

Before upload completes, sync chip shows pending local changes waiting to be synced.

![Observe pending sync state](images/step-03-pending-sync-state.png)

## Step 4: Trigger immediate sync from status bar

Use the status bar sync action to upload pending changes immediately.

![Trigger immediate sync from status bar](images/step-04-trigger-sync-from-status-bar.png)

## Step 5: Confirm synced state

After upload finishes, the sync chip returns to **Synced**.

![Confirm synced state](images/step-05-synced-state.png)

## Manual Notes

- S3 auto sync also runs on interval from App Settings.
- Use the status bar sync action when you need immediate upload.
