# notegit

A Git-, S3-, or local-backed Markdown note-taking desktop app built with Electron and React.

**Version**: 2.6.3  
**License**: MIT

## Overview

- Markdown + text editors with live preview (Mermaid supported in `.md` files)
- Git or S3 storage with history
- Local-only mode with no remote sync
- Fast search, find/replace, import/export
- Encrypted credentials, auto-save, and sync
- macOS, Windows, Linux
- Keyboard shortcuts populate the tree view (add/import/rename/move/delete) and the editor, and a question-mark help icon sits to the right of the Settings button (or press `F1`) to open the shortcut helper with every shortcut listed.
- Favorites bar above the tree keeps starred files/folders handy (activate via the star icon or `Ctrl/Cmd + Shift + S` and use the context menu to remove items).
- Right-click any tree entry to rename, move, favorite/unfavorite, or delete it with the matching toolbar icon.
- Right-click the empty tree background (when nothing is selected) to reveal New File, New Folder, and Import actions.

## Quick start

- Launch the app and connect a repository (Git, S3, or Local)
  - S3 requires bucket versioning for history
- Create or open a note and start editing

## From source (short)

Prereqs: Node.js 18+, pnpm, Git (for Git repos), S3 credentials (for S3 repos). Local-only mode requires no external services.

This is a single command does everything necessarry and runs. Divide and use it.

However, if you want to install it to your machine, check the setup procedures.

```bash
pnpm run clean && pnpm install  && pnpm run build && pnpm lint && pnpm test && pnpm start
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
