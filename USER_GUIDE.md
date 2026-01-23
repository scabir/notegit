# notegit User Guide

Complete guide to using notegit - your Git- and S3-backed markdown note-taking application.

**Version**: 2.1.1  
**Last Updated**: November 17, 2025

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [First-Time Setup](#first-time-setup)
3. [Connecting to a Repository](#connecting-to-a-repository)
4. [Creating and Editing Notes](#creating-and-editing-notes)
5. [File and Folder Management](#file-and-folder-management)
6. [Search and Find & Replace](#search-and-find--replace)
7. [Git Operations](#git-operations)
8. [History and Versions](#history-and-versions)
9. [Import and Export](#import-and-export)
10. [Settings and Customization](#settings-and-customization)
11. [Keyboard Shortcuts](#keyboard-shortcuts)
12. [Troubleshooting](#troubleshooting)

---

## First-Time Setup

### System Requirements

- **Operating System**: macOS 10.13+, Windows 10+, or Linux (Ubuntu 18.04+)
- **Git**: Required for Git repositories (not needed for S3-only workflows)
- **AWS S3**: Optional for S3 repositories (bucket with versioning enabled + credentials)
- **Internet Connection**: Required for initial repository setup and syncing

### First Launch

1. Open notegit
2. Click **Connect to Repository** and follow the prompts

---

## Connecting to a Repository

### Prerequisites (Git)

- Repository URL (HTTPS or SSH)
- Authentication (PAT or SSH key)
- Branch name (default: `main`)

For S3 repositories, see **Connecting to an S3 Bucket** below. For PAT/SSH setup, use your Git provider docs.

### Connecting in notegit

#### Git

1. Click **Connect to Repository**
2. **Repository type**: Git
3. Fill **Remote URL**, **Branch**, **Auth Method**, and **PAT** (if HTTPS)
4. Click **Connect**

#### Switching Repositories

- **Settings** → **Repository** → **Disconnect** → **Connect**

---

### Connecting to an S3 Bucket

- **Bucket** and **Region**
- **Access Key ID** + **Secret Access Key** (session token optional)
- **Bucket versioning** enabled (required for history)

Steps:
1. Click **Connect to Repository**
2. **Repository type**: S3
3. Enter **Bucket**, **Region**, optional **Prefix**
4. Enter credentials and click **Connect**

Notes: **Prefix** scopes notes to a folder (e.g., `notes/`). Credentials are stored encrypted locally.

---

## Creating and Editing Notes

### Creating Notes

- **New File** icon to create a note (adds `.md` if missing)
- **New Folder** icon to create folders
- Create items inside the selected folder to place them there

### S3 Naming Rules

For S3 repositories, spaces in file or folder names are replaced with `-`.

### Editors

- **Markdown**: split editor + preview, formatting toolbar, save with `Ctrl/Cmd+S`
- **Text**: single-pane editor

### Saving

- Manual: `Ctrl/Cmd+S`
- Auto-save: every 5 minutes by default (configurable)
- Git: save → commit → pull → push
- S3: save locally and upload immediately; background sync continues

### Images

Import images and reference them in markdown: `![Alt](./path)`

### Mermaid Diagrams

- Mermaid diagrams render in **Split View** or **Preview Only** for `.md` files
- Use fenced code blocks with the `mermaid` language tag
- Other file types show the code block as plain text

Example:

````markdown
```mermaid
erDiagram
  CUSTOMER }|..|{ DELIVERY-ADDRESS : has
  CUSTOMER ||--o{ ORDER : places
  CUSTOMER ||--o{ INVOICE : "liable for"
  DELIVERY-ADDRESS ||--o{ ORDER : receives
  INVOICE ||--|{ ORDER : covers
  ORDER ||--|{ ORDER-ITEM : includes
  PRODUCT-CATEGORY ||--|{ PRODUCT : contains
  PRODUCT ||--o{ ORDER-ITEM : "ordered in"
```
````

---

## File and Folder Management

- Select files in the tree to open them
- Rename, move, and delete using the toolbar actions
- Moves validate conflicts and prevent moving into itself
- Deleting a folder removes its contents
- Import adds any file type into the repo

---

## Search and Find & Replace

- **Quick file search**: `Ctrl/Cmd+P` or `Ctrl/Cmd+K`
- **Find in file**: `Ctrl/Cmd+F` (with replace)
- **Find in repo**: `Ctrl/Cmd+Shift+F` (with replace)
- Options: case-sensitive and regex

---

## Git Operations

Git operations apply to Git repositories only.

- Workflow: save → commit → pull → push (automatic)
- Manual controls: fetch, pull, push from the status bar
- Auto-push retries when offline
- Conflicts require an external Git client to resolve

### S3 Sync Behavior

- S3 repositories do not use commits or pull/push buttons
- Sync runs automatically on the **S3 Auto Sync** interval
- Deletes and moves are applied to S3 immediately; if offline, they are queued and retried
- The status bar shows "changes waiting" until the next sync completes

---

## History and Versions

- Open a file to see its history panel
- Click an entry to view a read-only version
- S3 history requires bucket versioning and uses object versions
- Diff view is not available for S3 history

---

## Import and Export

- **Import**: toolbar → choose file and destination (any file type)
- **Export current note**: Settings → Export → choose format and location
- **Export repository**: Settings → Export → ZIP of the repo

---

## Settings and Customization

- **Open Settings**: gear icon or `Ctrl/Cmd+,`
- **App settings**: theme, auto-save, S3 auto sync (S3 profiles)
- **Repository settings**: Git URL/branch or S3 bucket/region/prefix + credentials
- **Export**: current note or repository ZIP

### Data Location

Your data is stored in:
- **macOS**: `~/Library/Application Support/notegit/`
- **Windows**: `%APPDATA%/notegit/`
- **Linux**: `~/.config/notegit/`

**Contains**:
- `config/`: Settings files
- `repos/`: Local repository clones
- `logs/`: Application logs

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+S` | Save current file |
| `Ctrl/Cmd+P` | Open quick file search |
| `Ctrl/Cmd+K` | Open quick file search (alternative) |
| `Ctrl/Cmd+F` | Find in current file |
| `Ctrl/Cmd+Shift+F` | Find in repository |
| `Ctrl/Cmd+,` | Open settings |
| `Ctrl/Cmd+Q` | Quit application |

### Editor Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+B` | Bold |
| `Ctrl/Cmd+I` | Italic |
| `Ctrl/Cmd+Z` | Undo |
| `Ctrl/Cmd+Shift+Z` | Redo |
| `Tab` | Indent |
| `Shift+Tab` | Outdent |

### Find & Replace Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Find next |
| `Shift+Enter` | Find previous |
| `Esc` | Close find bar |
| `Ctrl/Cmd+H` | Open replace (in some contexts) |

### Tree Navigation

| Shortcut | Action |
|----------|--------|
| `↑` `↓` | Navigate tree |
| `Enter` | Open selected file |
| `Delete` | Delete selected item |

---

## Troubleshooting

- Authentication failed: verify URL/branch/credentials and repo access
- S3 versioning required: enable bucket versioning in AWS
- S3 changes not syncing: check S3 Auto Sync toggle/interval and credentials
- Push fails or conflicts (Git): resolve in a Git client, then pull again
- Mermaid not rendering: ensure `.md` file, a fenced code block with `mermaid`, and Preview/Split View
- Slow performance: large repos or many files
- White screen: restart, check logs, reinstall if needed
- Lost changes: check file history or your Git client

### Logs

Logs are in: `~/Library/Application Support/notegit/logs/`

- `main.log`: General application logs
- `error.log`: Error messages

### Report Issues

Open an issue at [GitHub Issues](https://github.com/scabir/notegit/issues) with steps, OS/version, and relevant logs.

---

## Best Practices

- Keep folders shallow and names clear (use hyphens, add dates when useful)
- Export backups periodically
- For S3, avoid spaces (auto-converted to `-`)
- Use basic Markdown: headings, lists, links, code blocks
- Use Mermaid code blocks for diagrams in `.md` files

---

## About notegit

**Version**: 2.1.1  
**Author**: Suleyman Cabir Ataman, PhD  
**GitHub**: [github.com/scabir/notegit](https://github.com/scabir/notegit)  
**License**: MIT

### Credits

Built with:
- Electron - Desktop framework
- React - UI library
- TypeScript - Type safety
- Material-UI - Component library
- CodeMirror - Editor
- simple-git - Git operations

---

**Need more help?** Check the [main README](./README.md) for technical details or open an issue on [GitHub](https://github.com/scabir/notegit/issues).

Happy note-taking! 📝
