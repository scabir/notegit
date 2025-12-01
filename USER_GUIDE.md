# notegit User Guide

Complete guide to using notegit - your Git-backed markdown note-taking application.

**Version**: 1.2.0  
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

## Quick Start

**5-Minute Walkthrough**:

1. **Launch** notegit
2. **Connect** to a Git repository (GitHub, GitLab, etc.)
3. **Create** your first note
4. **Edit** in the markdown editor with live preview
5. **Save** - changes are automatically committed and synced

That's it! Your notes are now backed by Git with full version history.

---

## First-Time Setup

### System Requirements

- **Operating System**: macOS 10.13+, Windows 10+, or Linux (Ubuntu 18.04+)
- **Git**: Must be installed and accessible from command line
- **Internet Connection**: Required for initial repository setup and syncing

### Verify Git Installation

Before launching notegit, verify Git is installed:

**macOS/Linux**:
```bash
git --version
```

**Windows**:
```cmd
git --version
```

If Git is not found:
- **macOS**: `brew install git`
- **Windows**: Download from [git-scm.com](https://git-scm.com/downloads)
- **Linux**: `sudo apt install git` (Debian/Ubuntu)

### First Launch

1. **Open notegit** from your Applications folder or Start menu
2. You'll see the welcome screen with "Connect to Repository" button
3. If you don't have a repository yet, create one on GitHub, GitLab, or any Git hosting service

---

## Connecting to a Repository

### Prerequisites

You need:
1. A Git repository (GitHub, GitLab, Bitbucket, or self-hosted)
2. Repository URL (HTTPS or SSH)
3. Authentication credentials (Personal Access Token for HTTPS, or SSH key for SSH)

### Setting Up a GitHub Repository

If you don't have a notes repository yet:

1. Go to [GitHub](https://github.com) and sign in
2. Click **New Repository**
3. Name it (e.g., `my-notes`)
4. Choose **Private** (recommended for personal notes)
5. ✅ Check "Initialize this repository with a README"
6. Click **Create repository**
7. Copy the repository URL (HTTPS: `https://github.com/username/my-notes.git`)

### Creating a GitHub Personal Access Token (PAT)

For HTTPS authentication, you need a Personal Access Token:

1. Go to GitHub **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token** → **Generate new token (classic)**
3. Give it a name: `notegit`
4. Set expiration: 90 days (or No expiration for convenience)
5. ✅ Select scope: **`repo`** (Full control of private repositories)
6. Click **Generate token**
7. **Copy the token immediately** (you won't see it again!)

### Using SSH Authentication

If you prefer SSH (no PAT needed):

1. Ensure you have SSH keys set up: `ls ~/.ssh/`
2. If not, generate one: `ssh-keygen -t ed25519 -C "your_email@example.com"`
3. Add to GitHub: **Settings** → **SSH and GPG keys** → **New SSH key**
4. Copy your public key: `cat ~/.ssh/id_ed25519.pub`
5. Paste into GitHub and save

### Connecting in notegit

#### First Connection

1. Click **Connect to Repository** on welcome screen
2. Enter repository details:
   - **Remote URL**: 
     - HTTPS: `https://github.com/username/my-notes.git`
     - SSH: `git@github.com:username/my-notes.git`
   - **Branch**: `main` (or `master` for older repos)
   - **Authentication Method**: 
     - Choose **HTTPS** if using PAT
     - Choose **SSH** if using SSH keys
   - **Personal Access Token**: (only for HTTPS) Paste your PAT

3. Click **Connect**
4. Wait for repository to clone (progress shown in status bar)
5. Once complete, your file tree appears on the left

#### Reconnecting to a Different Repository

1. Click **Settings** (gear icon) in top-right
2. Go to **Repository** tab
3. Click **Disconnect** (if currently connected)
4. Enter new repository details
5. Click **Connect**

---

## Creating and Editing Notes

### Creating a New Note

#### From the Toolbar

1. Click the **New File** icon (📄+) in the left panel toolbar
2. Enter file name (e.g., `meeting-notes`)
3. Extension will auto-add `.md` if not specified
4. Click **Create**
5. File appears in the tree and opens in the editor

#### Creating in a Folder

1. **Select** a folder in the tree
2. Click **New File** icon
3. File is created inside the selected folder

#### Creating a Folder

1. Click **New Folder** icon (📁+)
2. Enter folder name
3. Click **Create**

### File Types

notegit supports:

- **`.md` / `.markdown`**: Markdown files (split-pane editor with preview)
- **`.txt`**: Plain text files (single-pane editor)
- **Other files**: Can be imported and viewed but not edited

### The Markdown Editor

#### Layout

```
┌─────────────────────────────────────────┐
│  File: meeting-notes.md        [Save]   │
├─────────────────┬───────────────────────┤
│                 │                       │
│  # Meeting      │  Meeting              │
│  ## Agenda      │  Agenda               │
│  - Item 1       │  • Item 1             │
│  - Item 2       │  • Item 2             │
│                 │                       │
│  Editor         │  Preview              │
│  (Edit here)    │  (Live preview)       │
│                 │                       │
└─────────────────┴───────────────────────┘
```

#### Toolbar

- **Bold** (`Ctrl/Cmd+B`): Make text bold
- **Italic** (`Ctrl/Cmd+I`): Make text italic
- **H1/H2/H3**: Insert headings
- **List**: Insert bullet or numbered list
- **Code**: Insert inline code or code block
- **Toggle Preview**: Show/hide preview pane
- **Resize**: Drag the divider between editor and preview

#### Editing

1. **Type** markdown in the left pane
2. **See** live preview in the right pane
3. **Save** with `Ctrl/Cmd+S` or click Save icon
4. Changes are **auto-saved** every 5 minutes

#### Preview Editing (WYSIWYG)

You can also edit directly in the preview pane:
- Click in the preview
- Edit text
- Changes sync back to markdown source
- Formatting is preserved

### The Text Editor

For `.txt` files, you get a single-pane editor:
- Simple text editing
- No markdown formatting
- Same save behavior

### Saving

#### Manual Save

- Click **Save** icon in toolbar
- Press `Ctrl/Cmd+S`
- Triggers: Save → Commit → Pull → Push

#### Auto-Save

- Enabled by default
- Saves every 5 minutes
- Saves when closing app
- Can be configured in Settings

### Images in Markdown

To include images:

1. **Import** image file using Import button
2. **Reference** in markdown:
   ```markdown
   ![Alt text](./images/screenshot.png)
   ```
3. Images display in preview pane

---

## File and Folder Management

### Selecting Files

- **Click** on any file in the tree to open it
- **Click on empty space** to deselect (closes editor)
- Selected file is highlighted

### Renaming Files and Folders

1. Click **Rename** icon (✏️) in toolbar
2. Dialog shows with current name
3. Enter new name
4. Click **Rename**
5. File/folder is renamed and change is committed

### Moving Files and Folders

1. Select file/folder to move
2. Click **Move** icon
3. Dialog opens with folder tree
4. Select destination folder (or root)
5. Click **Move Here**
6. File/folder is moved and committed

#### Validation

- Cannot move folder into itself or its subfolders
- Cannot move to same location
- Warns if name conflict exists

### Deleting Files and Folders

1. Select file/folder
2. Click **Delete** icon (🗑️)
3. Confirm deletion
4. **Warning**: Folder deletion deletes all contents
5. Changes are committed automatically

### Importing Files

1. Click **Import** icon (📥)
2. File browser opens
3. Select file from your computer
4. Choose destination in repo
5. File is copied into repo

---

## Search and Find & Replace

### Quick File Search

**Open**: `Ctrl/Cmd+P` or `Ctrl/Cmd+K`

1. Search dialog opens
2. Type file name or partial match
3. Results appear instantly
4. Click result to open file
5. Press `Enter` on selected result

### Single-File Find & Replace

**Open**: `Ctrl/Cmd+F` (when file is open)

#### Find Bar

```
┌────────────────────────────────────────┐
│ Find: [search term___]  ⬆️ ⬇️ ×        │
│ Replace: [new term___]  Replace | All  │
└────────────────────────────────────────┘
```

**Actions**:
- **Find Next**: `Enter` or ⬇️ button
- **Find Previous**: `Shift+Enter` or ⬆️ button
- **Replace**: Replace current match and move to next
- **Replace All**: Replace all matches in file
- **Close**: × button or `Esc`

**Features**:
- Highlights current match
- Shows match count (e.g., "3/10")
- Wraps around when reaching end
- Pre-fills with current selection

### Repo-Wide Find & Replace

**Open**: `Ctrl/Cmd+Shift+F`

Search across all `.md` files in your repository.

#### Search Dialog

```
┌────────────────────────────────────────┐
│  Find in Repository                    │
├────────────────────────────────────────┤
│ Find: [search___________________]  🔍  │
│ Replace: [replacement____________]     │
│                                        │
│ ☐ Case sensitive   ☐ Use regex        │
├────────────────────────────────────────┤
│ Results: 15 matches in 3 files         │
│                                        │
│ 📄 meeting-notes.md (5 matches)        │
│   Line 3: found search term here       │
│   Line 7: another search term          │
│                                        │
│ 📄 project-ideas.md (10 matches)       │
│   Line 1: search term in title         │
│   ...                                  │
└────────────────────────────────────────┘
```

**Actions**:
- **Search**: Find all matches
- **Replace in File**: Replace all matches in one file
- **Replace All**: Replace all matches across all files
- **Click Match**: Jump to that line in file

**Options**:
- **Case Sensitive**: Match exact case
- **Use Regex**: Use regular expressions (e.g., `test\d+`)

**Safety**:
- Shows count before replacing
- Confirms before bulk operations
- Local changes preserved if replace fails

---

## Git Operations

### Understanding the Invisible Git Workflow

notegit uses an "invisible Git workflow" - you don't need to think about Git commands:

1. **Edit** → You type in editor
2. **Save** → File saved to disk + Git commit created
3. **Pull** → Fetches latest changes from remote
4. **Push** → Uploads your commits to remote

All automatic!

### Manual Git Operations

#### Pull (Fetch Latest)

1. Click **Status** bar at bottom
2. Click **Pull** button
3. Latest changes downloaded
4. If conflicts: You'll be notified

#### Push (Upload Changes)

1. Normally happens automatically after save
2. Manual push: Click **Push** in status bar
3. Uploads all local commits

#### Commit with Custom Message

1. Save changes to file
2. Click **Commit** icon (📝) in toolbar
3. Enter commit message
4. Click **Commit**
5. Automatically pulls and pushes

#### Commit All Changes

The "Save All" button commits all open unsaved files:
1. Click **Save All** icon
2. All changes committed with timestamp
3. Auto-pull and push

### Repository Status

Status bar shows:
- **Branch** name (e.g., `main`)
- **Connection** status (Connected/Offline)
- **Pending** changes count
- **Last sync** time

### Auto-Push Mechanism

If push fails (offline, network issue):
1. Commit is saved locally
2. Status bar shows "Pending pushes: 1"
3. Background timer checks connection every 30s
4. Automatically pushes when connection restored
5. You don't lose any work!

### Handling Conflicts

If you have conflicts (edited same file elsewhere):

1. notegit **cannot auto-merge** conflicts
2. You'll see error message
3. **Solution**:
   - Open repo folder in terminal or Git client
   - Manually resolve conflicts
   - Return to notegit and pull again

---

## History and Versions

### Viewing File History

1. **Open** a file
2. **History panel** appears on right
3. Shows all commits that modified this file

#### History Panel

```
┌────────────────────────────────┐
│ History: meeting-notes.md      │
├────────────────────────────────┤
│ ● Update note: meeting-notes   │
│   2 hours ago | John Doe       │
│   a3f4c9b                       │
├────────────────────────────────┤
│ ● Autosave: meeting-notes      │
│   5 hours ago | John Doe       │
│   b7e2d1a                       │
├────────────────────────────────┤
│ ● Initial commit               │
│   1 day ago | John Doe         │
│   c4f8e2b                       │
└────────────────────────────────┘
```

**Information shown**:
- Commit message
- Time ago
- Author name
- Short commit hash

### Viewing Previous Versions

1. **Click** on any commit in history panel
2. **Read-only viewer** opens below or beside editor
3. Shows file content at that point in time
4. Clearly marked as "Historical Version - Read Only"

**Note**: You cannot edit or restore from history panel (coming in future version). To revert, use Git client or terminal.

### Comparing Versions

Currently not supported in UI. Use external Git client for diff viewing.

---

## Import and Export

### Importing Files

#### Import a Single File

1. Click **Import** icon (📥) in toolbar
2. File browser opens
3. Select file from your computer
4. Specify destination in repo (root or folder)
5. File is copied and committed

**Supported**: Any file type (images, PDFs, markdown, text, code)

### Exporting Notes

#### Export Current Note

1. Open note to export
2. Go to **Settings** → **Export** tab
3. Click **Export Current Note**
4. Choose format (`.md` or `.txt`)
5. Select save location
6. File is saved

**Note**: Exports current in-memory content (includes unsaved edits)

#### Export Entire Repository

1. Go to **Settings** → **Export** tab
2. Click **Export Repository as ZIP**
3. Choose save location
4. Wait for zip creation
5. Zip file includes all tracked files

**Use cases**:
- Backup entire note collection
- Share notes with someone
- Move to another app

---

## Settings and Customization

### Opening Settings

- Click **Settings** icon (⚙️) in top-right
- Or press `Ctrl/Cmd+,`

### Settings Tabs

#### General Settings

**Theme**:
- **Light**: Light mode
- **Dark**: Dark mode
- **System**: Follow OS theme (auto-switches)

**Auto-Save**:
- ☑️ Enable auto-save (default: on)
- Interval: 5 minutes (recommended)

#### Repository Settings

**Current Repository**:
- Remote URL
- Branch
- Last sync time

**Change Repository**:
- Disconnect from current
- Connect to different repo

**Credentials**:
- Update Personal Access Token
- Switch auth method (HTTPS ↔ SSH)

#### Export Settings

- Export current note as `.md` or `.txt`
- Export entire repo as `.zip`

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

### Common Issues and Solutions

#### Git Not Found

**Problem**: "Git is not installed" error on launch

**Solution**:
1. Install Git for your platform
2. Restart notegit
3. Verify: `git --version` in terminal

#### Authentication Failed

**Problem**: Cannot connect to repository

**Solutions**:
- **PAT expired**: Generate new Personal Access Token
- **Wrong credentials**: Double-check URL, branch, token
- **No repo access**: Verify permissions on GitHub/GitLab
- **SSH not configured**: Set up SSH keys or switch to HTTPS

#### Cannot Push Changes

**Problem**: Push fails with error

**Possible Causes**:
- **Offline**: Check internet connection, wait for auto-retry
- **Conflicts**: Pull first, resolve conflicts manually
- **No write access**: Verify repository permissions
- **Branch protected**: Check branch protection rules on GitHub

**Solution**:
1. Check status bar for details
2. Try manual pull and push
3. If conflict, resolve in Git client
4. Worst case: Export notes, reconnect to repo

#### Merge Conflicts

**Problem**: "Conflict detected" message

**Solution**:
1. Open repository folder:
   - macOS/Linux: `~/Library/Application Support/notegit/repos/[repo-name]/`
   - Windows: `%APPDATA%/notegit/repos/[repo-name]/`
2. Use Git client or terminal:
   ```bash
   git status
   git merge --abort  # or resolve manually
   ```
3. Return to notegit, click Pull

#### Slow Performance

**Problem**: App feels sluggish

**Solutions**:
- **Large repository**: Consider splitting into smaller repos
- **Many files**: Close unused files
- **Auto-save disabled**: Check settings
- **Clear cache**: Restart application

#### White Screen

**Problem**: App opens to blank white screen

**Solutions**:
1. **Hard refresh**: Close and reopen app
2. **Check logs**: `~/Library/Application Support/notegit/logs/`
3. **Reinstall**: Uninstall and reinstall app
4. **Report bug**: Open issue on GitHub with log files

#### Lost Changes

**Problem**: Edits disappeared

**Don't Panic**:
- Changes are committed to Git
- Check file history in Git
- Use `git log` and `git show` to find commits

**Recovery**:
```bash
cd ~/Library/Application\ Support/notegit/repos/[repo-name]/
git log --all --oneline
git show [commit-hash]:[file-path]
```

### Getting Help

#### Check Logs

Logs are in: `~/Library/Application Support/notegit/logs/`

- `main.log`: General application logs
- `error.log`: Error messages

#### Report Issues

1. Go to [GitHub Issues](https://github.com/scabir/notegit/issues)
2. Check if issue already exists
3. Create new issue with:
   - Description of problem
   - Steps to reproduce
   - System information (OS, notegit version)
   - Relevant log excerpts
   - Screenshots if applicable

#### Feature Requests

Open an issue with `enhancement` label describing your desired feature.

---

## Best Practices

### Organizing Notes

**Folder Structure**:
```
my-notes/
├── daily/
│   ├── 2025-01-15.md
│   └── 2025-01-16.md
├── projects/
│   ├── project-a.md
│   └── project-b.md
├── meetings/
│   └── team-meeting-2025-01-15.md
└── ideas/
    └── brainstorm.md
```

**Naming Conventions**:
- Use lowercase
- Use hyphens instead of spaces (`meeting-notes.md`)
- Include dates for daily notes (`2025-01-15.md`)
- Be descriptive (`project-alpha-kickoff.md` not `notes.md`)

### Markdown Tips

**Headers**:
```markdown
# H1 - Main Title
## H2 - Section
### H3 - Subsection
```

**Lists**:
```markdown
- Bullet point
  - Nested point
1. Numbered item
2. Another item
```

**Links**:
```markdown
[GitHub](https://github.com)
[Another Note](./projects/project-a.md)
```

**Images**:
```markdown
![Screenshot](./images/screenshot.png)
```

**Code**:
````markdown
Inline `code` here

```javascript
function example() {
  return "code block";
}
```
````

### Git Best Practices

- **Commit often**: Don't worry, auto-save handles this
- **Descriptive messages**: Use manual commit for important changes
- **Pull before editing**: Ensures you have latest version
- **Backup regularly**: Export repo as zip periodically
- **Don't force push**: Can cause data loss

---

## About notegit

**Version**: 1.2.0  
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

