# Architecture

notegit is an Electron app with a React renderer and a Node/Electron main process.

```
Renderer (React + CodeMirror)
  <-> IPC (typed bridge)
Preload (context bridge)
  <-> IPC handlers
Main process services
  <-> adapters (fs, git, s3, crypto)
```

## Key modules

- **Renderer**: React UI, Markdown/Text editors, MUI components
- **Preload**: `window.notegitApi` bridge with typed IPC calls
- **Handlers**: IPC endpoints for files, repo, config, search, history, export
- **Services**: business logic (files, repo, config, history, search, export)
- **Adapters**: filesystem, Git CLI, S3, encryption
- **Shared types**: `app/desktop/src/shared/types` used in renderer + main

## Data storage

App data lives in the OS app-data folder:

- macOS: `~/Library/Application Support/notegit/`
- Windows: `%APPDATA%/notegit/`
- Linux: `~/.config/notegit/`

Folders:

- `config/` app and repo settings
- `logs/` app logs
- `repos/` local git clones or S3 working dir

## Security

- Context isolation enabled; node integration disabled in renderer
- Only the preload API is exposed to the UI
- Credentials are encrypted locally (AES-256-GCM)

## Tech stack

- Electron, React, TypeScript, Vite
- CodeMirror 6 for editing
- MUI for UI components
- simple-git for Git operations
- AWS SDK for S3
