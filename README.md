# notegit

A Git- or S3-backed Markdown note-taking desktop app built with Electron and React.

**Version**: 2.1.2  
**License**: MIT

## Overview

- Markdown + text editors with live preview (Mermaid supported in `.md` files)
- Git or S3 storage with history
- Fast search, find/replace, import/export
- Encrypted credentials, auto-save, and sync
- macOS, Windows, Linux
- Keyboard shortcuts populate the tree view (add/import/rename/move/delete) and the editor, and a question-mark help icon sits to the right of the Settings button (or press `F1`) to open the shortcut helper with every shortcut listed.

## Quick start

- Launch the app and connect a repository (Git or S3)
  - S3 requires bucket versioning for history
- Create or open a note and start editing

## From source (short)

Prereqs: Node.js 18+, pnpm, Git (for Git repos), S3 credentials (for S3 repos).

```bash
pnpm install
pnpm run dev
```

Build and run:

```bash
pnpm run build
pnpm start
```

## Docs

- User guide: [USER_GUIDE.md](USER_GUIDE.md)
- Architecture and technical details: [docs/architecture/README.md](docs/architecture/README.md)
- Development and build workflows: [docs/development/README.md](docs/development/README.md)
- Testing and coverage: [docs/testing/README.md](docs/testing/README.md)
- Build scripts: [setup/README.md](setup/README.md)
- Build quick start: [setup/QUICK_START.md](setup/QUICK_START.md)

## Support

Open an issue: https://github.com/scabir/notegit/issues
