# notegit

notegit is a desktop Markdown notes app that works with Git, S3, or Local repositories.

[![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/scabir/notegit/main/badges/coverage.json)](https://github.com/scabir/notegit/actions/workflows/coverage.yml)
[![Integration](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/scabir/notegit/main/badges/integration.json)](https://github.com/scabir/notegit/actions/workflows/integration.yml)
[![macOS DMG](https://github.com/scabir/notegit/actions/workflows/macos-dmg.yml/badge.svg)](https://github.com/scabir/notegit/actions/workflows/macos-dmg.yml)
[![Windows Installer](https://github.com/scabir/notegit/actions/workflows/windows-installer.yml/badge.svg)](https://github.com/scabir/notegit/actions/workflows/windows-installer.yml)
[![Linux Packages](https://github.com/scabir/notegit/actions/workflows/linux-packages.yml/badge.svg)](https://github.com/scabir/notegit/actions/workflows/linux-packages.yml)

**Version**: 2.8.1  
**License**: MIT

## For Users

### What you can do

- Connect a Git, S3, or Local repository
- Write and preview Markdown notes
- Organize notes with folders, rename/move/duplicate, and favorites
- Search and replace in file and across repository
- Use history/version views and export notes or full repository ZIP

### Quick Start (End Users)

1. Install notegit from the latest release.
2. Open the app and connect a repository:

- Git
- S3
- Local (offline)

3. Create your first note and save with `Ctrl/Cmd + S`.
4. Use tutorials for feature-by-feature walkthroughs.

### Install

Download the latest release from GitHub:

1. [macOS Intel DMG](https://github.com/scabir/notegit/releases/latest/download/notegit-macos-x64.dmg)
2. [macOS Apple Silicon DMG](https://github.com/scabir/notegit/releases/latest/download/notegit-macos-arm64.dmg)
3. [Windows x64 Installer](https://github.com/scabir/notegit/releases/latest/download/notegit-windows-x64-setup.exe)
4. [Linux Debian Package (`.deb`)](https://github.com/scabir/notegit/releases/latest/download/notegit-linux-amd64.deb)
5. [Linux RPM Package (`.rpm`)](https://github.com/scabir/notegit/releases/latest/download/notegit-linux-x86_64.rpm)

All releases: [github.com/scabir/notegit/releases](https://github.com/scabir/notegit/releases)

### Start Here

- User guide: [USER_GUIDE.md](USER_GUIDE.md)
- Step-by-step tutorials with screenshots: [tutorials/README.md](tutorials/README.md)

### Popular Tutorials

- Git setup: [Connect Git Repository](tutorials/scenarios/connect-git-repository/README.md)
- Git workflow: [Create and Edit Markdown in Preview + Split](tutorials/scenarios/create-and-edit-markdown-preview-split/README.md)
- Git sync: [Commit, Pull, Push from Status Bar](tutorials/scenarios/commit-pull-push-from-status-bar/README.md)
- S3 setup: [Connect S3 Bucket with Prefix](tutorials/scenarios/connect-s3-bucket-with-prefix/README.md)
- Local offline mode: [Create Local Repository and Work Offline](tutorials/scenarios/create-local-repository-and-work-offline/README.md)
- Language settings: [Switch Language and Verify Persistence](tutorials/scenarios/switch-language-and-verify-persistence/README.md)

## Support

Open an issue: https://github.com/scabir/notegit/issues

## Developer Resources

- Developer's Guide: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- Architecture: [docs/architecture/README.md](docs/architecture/README.md)
- Testing: [docs/testing/README.md](docs/testing/README.md)
- Integration scenario catalog: [docs/testing/integration-tests.md](docs/testing/integration-tests.md)
- Build scripts: [app/desktop/setup/README.md](app/desktop/setup/README.md)
