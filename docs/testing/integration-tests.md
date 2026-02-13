# Integration Tests

Integration tests run the packaged Electron app with isolated test `userData` directories and mocked providers.

Current suite size:

- `(git)`: 60 scenarios
- `(S3)`: 53 scenarios
- Total: 113 scenarios

## (git)

### Setup and profiles (`integration-tests/git/repo-setup-screen.integration.spec.ts`)

- Connect to Git repository (default and non-default branch)
- Validate required setup fields and setup cancellation flow
- Handle invalid remote URL and auth failure
- Bootstrap empty remote branch
- Reopen with existing repo and skip setup
- Enforce provider lock and profile activation/persistence rules

### File tree operations (`integration-tests/git/file-tree-view.integration.spec.ts`)

- Create, rename, move, duplicate, import, and delete files/folders
- Validate filename and rename input constraints
- Verify idempotent folder creation behavior
- Verify favorite toggle via context menus
- Verify background-context-menu create-in-root flow

### Status bar and sync flows (`integration-tests/git/status-bar-actions.integration.spec.ts`)

- Create/edit/save and commit+push flows
- Mixed-change commit paths and generated/custom commit message flows
- Push/Pull/Fetch enablement and state transitions
- Save-all and autosave behavior
- Failure handling: pull conflict, fetch/push/commit failures, offline mode
- Git unavailable warning handling

### History and navigation (`integration-tests/git/history-panel.integration.spec.ts`, `integration-tests/git/editor-shell-navigation.integration.spec.ts`)

- Load file history, version view, diff, and panel open/close behavior
- Empty history state for uncommitted files
- Keyboard back/forward navigation behavior, including no-op cases

### App lifecycle and isolation (`integration-tests/git/app-lifecycle.integration.spec.ts`)

- Restart and workspace recovery
- Persist uncommitted changes across restart
- Restore active-profile repository on restart
- Keep parallel app instances isolated by `userData` path

## (S3)

### Setup and profiles (`integration-tests/s3/repo-setup-screen.integration.spec.ts`)

- Connect to S3 repository (with and without prefix)
- Validate required setup fields and setup cancellation flow
- Block setup when bucket versioning is disabled
- Reopen with existing S3 repo and skip setup
- Enforce provider lock and profile activation/persistence rules

### File tree operations (`integration-tests/s3/file-tree-view.integration.spec.ts`)

- Create, rename, move, duplicate, import, and delete files/folders
- Validate filename and rename input constraints
- Verify idempotent folder creation behavior
- Verify favorite toggle via context menus
- Verify background-context-menu create-in-root flow
- Verify naming normalization on create/rename

### Status bar and sync flows (`integration-tests/s3/status-bar-actions.integration.spec.ts`)

- Create/edit/save and sync flows
- Local unsynced change visibility and sync-state transitions
- Save-all and autosave behavior
- Verify S3-specific status bar behavior (bucket label, hidden Git-only actions)
- Fetch/Pull safety behavior in S3 mode

### History and navigation (`integration-tests/s3/history-panel.integration.spec.ts`, `integration-tests/s3/editor-shell-navigation.integration.spec.ts`)

- Load object-version history and version view
- Empty history state for unsynced files
- History panel open/close behavior and newest-first ordering
- Unsupported diff path is surfaced correctly
- Keyboard back/forward navigation behavior, including no-op cases

### App lifecycle and isolation (`integration-tests/s3/app-lifecycle.integration.spec.ts`)

- Restart and workspace recovery
- Persist unsynced local changes across restart
- Restore active-profile repository on restart
- Keep parallel app instances isolated by `userData` path
- Keep same bucket with different prefixes isolated
