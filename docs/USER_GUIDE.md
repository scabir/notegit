# notegit User Guide

How to use notegit as an end user.

**Version**: 2.8.0  
**Last Updated**: March 7, 2026

## Table of Contents

1. [Quick Start](#quick-start)
2. [Connect a Git Repository (Step-by-Step)](#connect-a-git-repository-step-by-step)
3. [Connect an AWS S3 Bucket (Step-by-Step)](#connect-an-aws-s3-bucket-step-by-step)
4. [Connect a Local Repository (Offline)](#connect-a-local-repository-offline)
5. [Create and Edit Notes](#create-and-edit-notes)
6. [Organize Files and Folders](#organize-files-and-folders)
7. [Search and Replace](#search-and-replace)
8. [Sync and Git Actions](#sync-and-git-actions)
9. [History and Restore](#history-and-restore)
10. [Export Notes and Repositories](#export-notes-and-repositories)
11. [Language and Settings](#language-and-settings)
12. [Keyboard Shortcuts](#keyboard-shortcuts)
13. [Troubleshooting](#troubleshooting)

## Quick Start

1. Open notegit.
2. Click **Connect to Repository**.
3. Choose one provider:

- **Git** for remote Git repositories.
- **AWS S3** for bucket-backed notes.
- **Local** for offline notes on your device.

4. After connection, create/open a note from the file tree.

## Connect a Git Repository (Step-by-Step)

This is the same flow used in the tutorial scenario: [tutorials/scenarios/connect-git-repository/README.md](../tutorials/scenarios/connect-git-repository/README.md).

### Before opening notegit

1. Confirm the remote repository URL (HTTPS or SSH).
2. Confirm branch name (`main`, `master`, or your project branch).
3. Prepare authentication:

- HTTPS: Personal Access Token (PAT).
- SSH: existing SSH key access.

### Manual PAT setup (no in-app screenshot)

1. Open your Git provider account settings (GitHub/GitLab/Bitbucket).
2. Create a new token with repository read/write permissions.
3. Copy token once and store securely.
4. Return to notegit.

### In notegit

1. Click **Connect to Repository**.
2. Select **Git**.
3. Enter **Remote URL**.
4. Enter **Branch**.
5. Select auth method and enter credentials.
6. Click **Connect**.
7. Verify success:

- Status bar shows branch label.
- File tree is visible.

## Connect an AWS S3 Bucket (Step-by-Step)

### Before opening notegit

1. Pick bucket and AWS region.
2. Decide optional prefix (for example `notes/`).
3. Confirm bucket versioning is enabled (required for history).
4. Create IAM credentials with AWS S3 read/write access.

### Manual AWS setup (no in-app screenshot)

1. In AWS Console, open **AWS S3** and verify versioning is **Enabled** on the target bucket.
2. In IAM, create or use an access key with least required permissions.
3. Copy **Access Key ID** and **Secret Access Key**.
4. Return to notegit.

### In notegit

1. Click **Connect to Repository**.
2. Select **AWS S3**.
3. Fill **Bucket**, **Region**, optional **Prefix**.
4. Enter **Access Key ID** and **Secret Access Key** (session token optional).
5. Click **Connect**.
6. Verify success:

- Status bar shows bucket label.
- File tree is visible.

## Connect a Local Repository (Offline)

1. Click **Connect to Repository**.
2. Select **Local**.
3. Enter local repository name.
4. Click **Connect**.

Local repositories stay on your machine and do not push/pull/fetch.

## Create and Edit Notes

1. Create a file from file tree actions.
2. Use `.md` for Markdown preview support.
3. Write content in editor.
4. Use preview toggles:

- **Preview only**
- **Split view**

5. Save with `Ctrl/Cmd + S` (autosave also runs on interval).

## Organize Files and Folders

You can create folders, rename, move, duplicate, delete, import, and favorite items.

1. Right-click file/folder in tree for context actions.
2. Use toolbar shortcuts for quick operations.
3. Favorites appear in the favorites bar for fast access.

## Search and Replace

- File switcher: `Ctrl/Cmd + P` (or `Ctrl/Cmd + K`)
- Find in file: `Ctrl/Cmd + F`
- Find in repository: `Ctrl/Cmd + Shift + F`

Case-sensitive and regex options are available in search dialogs.

## Sync and Git Actions

### Git repositories

- Standard workflow: save -> commit -> pull -> push.
- Manual status-bar actions: fetch, pull, push.
- If authentication fails, refresh credentials in repository settings.

### AWS S3 repositories

- Saves queue/upload to AWS S3 using auto sync.
- Pending changes are shown in sync status until upload completes.

### Local repositories

- Save is local only.
- No remote sync actions.

## History and Restore

1. Open a file.
2. Open history panel.
3. Select a version to view.
4. Restore or copy required content.

Notes:

- AWS S3 history requires bucket versioning.
- Local repositories do not provide remote history.

## Export Notes and Repositories

Open **Settings -> Export**:

1. Export current note (Markdown/Text).
2. Export full repository as ZIP.

## Language and Settings

Open settings from the status bar gear icon.

You can manage:

- App language
- Autosave/sync intervals
- Repository settings
- Export and logs

Language choice persists across app restarts.

## Keyboard Shortcuts

Press `F1` to open the built-in shortcut helper.

## Troubleshooting

### Cannot connect Git repository

- Check remote URL format and branch name.
- Verify token/SSH permissions.
- Confirm network/proxy access.

### Cannot connect AWS S3 bucket

- Verify bucket name and region.
- Confirm versioning is enabled.
- Check IAM access key permissions.

### Changes are not syncing

- Check status bar for pending/error state.
- Re-open repository settings and validate credentials.
- Retry from pull/push/sync actions.
