# notegit

A Git-, S3-, or local-backed Markdown note-taking desktop app built with Electron and React.

[![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/scabir/notegit/main/badges/coverage.json)](https://github.com/scabir/notegit/actions/workflows/coverage.yml)
[![Integration](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/scabir/notegit/main/badges/integration.json)](https://github.com/scabir/notegit/actions/workflows/integration.yml)
[![macOS DMG](https://github.com/scabir/notegit/actions/workflows/macos-dmg.yml/badge.svg)](https://github.com/scabir/notegit/actions/workflows/macos-dmg.yml)
[![Windows Installer](https://github.com/scabir/notegit/actions/workflows/windows-installer.yml/badge.svg)](https://github.com/scabir/notegit/actions/workflows/windows-installer.yml)
[![Linux Packages](https://github.com/scabir/notegit/actions/workflows/linux-packages.yml/badge.svg)](https://github.com/scabir/notegit/actions/workflows/linux-packages.yml)

**Version**: 2.7.8  
**License**: MIT

## Highlights

- Markdown and text editors with live preview (Mermaid in `.md` files)
- Repository providers: `git`, `s3`, and `local`
- File history, search, import/export, and keyboard shortcuts
- Encrypted credentials, autosave, and sync support
- Runs on macOS, Windows, and Linux

## Quick start

- Launch the app and connect a repository (Git, S3, or Local)
- Create or open a note and start editing
- S3 requires bucket versioning for history

## Build Artifacts (CI)

Direct downloads from the latest GitHub release:

1. [macOS Intel DMG](https://github.com/scabir/notegit/releases/latest/download/notegit-macos-x64.dmg)
2. [macOS Apple Silicon DMG](https://github.com/scabir/notegit/releases/latest/download/notegit-macos-arm64.dmg)
3. [Windows x64 Installer](https://github.com/scabir/notegit/releases/latest/download/notegit-windows-x64-setup.exe)
4. [Linux Debian Package (`.deb`)](https://github.com/scabir/notegit/releases/latest/download/notegit-linux-amd64.deb)
5. [Linux RPM Package (`.rpm`)](https://github.com/scabir/notegit/releases/latest/download/notegit-linux-x86_64.rpm)

All releases: [github.com/scabir/notegit/releases](https://github.com/scabir/notegit/releases)

## Local development

Prerequisites:

- Node.js 18+
- `pnpm`
- Git (for Git repos)
- S3 credentials (for S3 repos)

Install dependencies:

```bash
cd app/desktop
pnpm install
```

Run in development:

```bash
cd app/desktop
pnpm run dev
```

Build:

```bash
cd app/desktop
pnpm run build
```

Quality checks:

```bash
cd app/desktop
pnpm run lint
pnpm run test
pnpm run test:coverage
pnpm run test:integration
```

Package installers:

```bash
cd app/desktop
pnpm run package
```

## Docs

- User guide: [USER_GUIDE.md](USER_GUIDE.md)
- Architecture and technical details: [docs/architecture/README.md](docs/architecture/README.md)
- Development and build workflows: [docs/development/README.md](docs/development/README.md)
- Testing and coverage: [docs/testing/README.md](docs/testing/README.md)
- Integration scenarios: [docs/testing/integration-tests.md](docs/testing/integration-tests.md)
- Build scripts: [app/desktop/setup/README.md](app/desktop/setup/README.md)
- Build quick start: [app/desktop/setup/QUICK_START.md](app/desktop/setup/QUICK_START.md)

## Support

Open an issue: https://github.com/scabir/notegit/issues
