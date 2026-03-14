# Technical Documentation

This is the canonical technical documentation for NoteBranch.

## Architecture

NoteBranch is an Electron app with a React renderer and a Node/Electron main process.

```
Renderer (React + CodeMirror)
  <-> IPC (typed bridge)
Preload (context bridge)
  <-> IPC handlers
Main process services
  <-> adapters (fs, git, AWS S3, crypto)
```

### Key modules

- **Renderer**: React UI, Markdown/Text editors, MUI components
- **Preload**: `window.NoteBranchApi` bridge with typed IPC calls
- **Handlers**: IPC endpoints for files, repo, config, search, history, export
- **Services**: business logic (files, repo, config, history, search, export)
- **Adapters**: filesystem, Git CLI, AWS S3, encryption
- **Shared types**: `app/desktop/src/shared/types` used in renderer + main

### Data storage

App data lives in the OS app-data folder:

- macOS: `~/Library/Application Support/NoteBranch/`
- Windows: `%APPDATA%/NoteBranch/`
- Linux: `~/.config/NoteBranch/`

Folders:

- `config/` app and repo settings
- `logs/` app logs
- `repos/` local git clones or AWS S3 working dir

### Security

- Context isolation enabled; node integration disabled in renderer
- Only the preload API is exposed to the UI
- Credentials are encrypted locally (AES-256-GCM)

### Tech stack

- Electron, React, TypeScript, Vite
- CodeMirror 6 for editing
- MUI for UI components
- simple-git for Git operations
- AWS SDK for AWS S3 operations

## Development

### Prerequisites

- Node.js 18+
- `pnpm`
- Git

### Project setup

```bash
cd app/desktop
pnpm install
```

### Run in development

```bash
cd app/desktop
pnpm run dev
```

### Build

```bash
cd app/desktop
pnpm run build
```

### Run built app

```bash
cd app/desktop
pnpm start
```

Optional with DevTools:

```bash
cd app/desktop
pnpm start -- --devtools
```

### Quality checks

```bash
cd app/desktop
pnpm run lint
pnpm run test
pnpm run test:coverage
pnpm run test:integration
```

### Packaging

Build installer artifacts:

```bash
cd app/desktop
pnpm run package
```

Platform-specific build helpers:

```bash
cd app/desktop/setup
./build-mac.sh
./build-windows.sh
./build-linux.sh
```

Artifacts are written to `app/desktop/release/`:

- `NoteBranch-{version}.dmg` and `NoteBranch-{version}-mac.zip`
- `NoteBranch Setup {version}.exe` and `NoteBranch {version}.exe`
- `NoteBranch-{version}.AppImage`, `NoteBranch_{version}_amd64.deb`, `NoteBranch-{version}.x86_64.rpm`

Build script docs:

- `app/desktop/setup/README.md`
- `app/desktop/setup/QUICK_START.md`

## Testing

### Run unit/integration-related test suites

```bash
cd app/desktop
pnpm test
```

### Coverage

```bash
cd app/desktop
pnpm run test:coverage
```

Coverage reports are written to `app/desktop/coverage/` and include frontend and backend unit tests.

Coverage gate exclusions can be configured using:

- `app/desktop/scripts/coverage-gate-excludes.json` (shared list)
- `COVERAGE_GATE_EXCLUDES=path1,path2` (environment override)
- `--exclude <path>` and `--exclude-file <path>` CLI options

Example:

```bash
cd app/desktop
node scripts/check-coverage-threshold.js --exclude src/backend/foo.ts
```

### Watch mode

```bash
cd app/desktop
pnpm run test:watch
```

### Test layout

- `app/desktop/src/unit-tests/backend/`
- `app/desktop/src/unit-tests/frontend/`
- `app/desktop/src/unit-tests/setup.ts`

## Integration Tests

Integration tests run the packaged Electron app with isolated test `userData` directories and mocked providers.

### Running locally

From `app/desktop`:

```bash
pnpm run test:integration
```

On Linux without an active display (`$DISPLAY`/`$WAYLAND_DISPLAY`), the runner automatically uses `xvfb-run`. If `xvfb-run` is missing, install `xvfb`.

Current suite size:

- `(git)`: 61 scenarios
- `(AWS S3)`: 49 scenarios
- Total: 110 scenarios

### Git scenarios

#### Setup and profiles (`app/desktop/integration-tests/git/repo-setup-screen.integration.spec.ts`)

- Connect to Git repository (default and non-default branch)
- Validate required setup fields and setup cancellation flow
- Handle invalid remote URL and auth failure
- Bootstrap empty remote branch
- Reopen with existing repo and skip setup
- Enforce provider lock and profile activation/persistence rules

#### File tree operations (`app/desktop/integration-tests/git/file-tree-view.integration.spec.ts`)

- Create, rename, move, duplicate, import, and delete files/folders
- Validate filename and rename input constraints
- Verify idempotent folder creation behavior
- Verify favorite toggle via context menus
- Verify background-context-menu create-in-root flow

#### Status bar and sync flows (`app/desktop/integration-tests/git/status-bar-actions.integration.spec.ts`)

- Create/edit/save and commit+push flows
- Mixed-change commit paths and generated/custom commit message flows
- Push/Pull/Fetch enablement and state transitions
- Save-all and autosave behavior
- Failure handling: pull conflict, fetch/push/commit failures, offline mode
- Git unavailable warning handling

#### History and navigation (`app/desktop/integration-tests/git/history-panel.integration.spec.ts`, `app/desktop/integration-tests/git/editor-shell-navigation.integration.spec.ts`)

- Load file history, version view, diff, and panel open/close behavior
- Empty history state for uncommitted files
- Keyboard back/forward navigation behavior, including no-op cases

#### App lifecycle and isolation (`app/desktop/integration-tests/git/app-lifecycle.integration.spec.ts`)

- Restart and workspace recovery
- Persist uncommitted changes across restart
- Restore active-profile repository on restart
- Keep parallel app instances isolated by `userData` path

### AWS S3 scenarios

#### Setup and profiles (`app/desktop/integration-tests/s3/repo-setup-screen.integration.spec.ts`)

- Connect to AWS S3 repository (with and without prefix)
- Validate required setup fields and setup cancellation flow
- Block setup when bucket versioning is disabled
- Reopen with existing AWS S3 repo and skip setup
- Enforce provider lock and profile activation/persistence rules

#### File tree operations (`app/desktop/integration-tests/s3/file-tree-view.integration.spec.ts`)

- Create, rename, move, duplicate, import, and delete files/folders
- Validate filename and rename input constraints
- Verify idempotent folder creation behavior
- Verify favorite toggle via context menus
- Verify background-context-menu create-in-root flow
- Verify naming normalization on create/rename

#### Status bar and sync flows (`app/desktop/integration-tests/s3/status-bar-actions.integration.spec.ts`)

- Create/edit/save and sync flows
- Local unsynced change visibility and sync-state transitions
- Save-all and autosave behavior
- Verify AWS S3-specific status bar behavior (bucket label, hidden Git-only actions)
- Fetch/Pull safety behavior in AWS S3 mode

#### History and navigation (`app/desktop/integration-tests/s3/history-panel.integration.spec.ts`, `app/desktop/integration-tests/s3/editor-shell-navigation.integration.spec.ts`)

- Load object-version history and version view
- Empty history state for unsynced files
- History panel open/close behavior and newest-first ordering
- Unsupported diff path is surfaced correctly
- Keyboard back/forward navigation behavior, including no-op cases

#### App lifecycle and isolation (`app/desktop/integration-tests/s3/app-lifecycle.integration.spec.ts`)

- Restart and workspace recovery
- Persist unsynced local changes across restart
- Restore active-profile repository on restart
- Keep parallel app instances isolated by `userData` path
- Keep same bucket with different prefixes isolated
