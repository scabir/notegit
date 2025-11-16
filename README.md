# notegit

A Git-backed Markdown note-taking desktop application built with Electron, React, and TypeScript.

## Features

- **Git-Based Storage**: Your notes are stored as plain Markdown files in a Git repository
- **Version Control**: Full Git history for every note with commit viewing
- **Markdown Editor**: Split-pane editor with live preview and syntax highlighting
- **Auto-Push**: Automatically pushes commits when connection is restored
- **File Management**: Create, rename, and delete files and folders
- **Encrypted Credentials**: Personal Access Tokens stored encrypted locally
- **Cross-Platform**: Runs on macOS, Windows, and Linux

## Prerequisites

- **Git**: Must be installed on your system
  - macOS: `brew install git`
  - Windows: Download from [git-scm.com](https://git-scm.com/downloads)
  - Linux: `sudo apt install git` or equivalent

- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/notegit.git
cd notegit
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

4. Start the application:
```bash
npm start
```

## Development

Run in development mode with hot reload:

```bash
npm run dev
```

This will start both the Vite dev server (port 5173) and Electron in development mode.

### Testing

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test Coverage**: 93 tests covering adapters, services, and core functionality
- CryptoAdapter: 100% coverage ✅
- GitAdapter: 70%+ coverage
- FilesService: 80%+ coverage
- ConfigService: 81% coverage
- HistoryService: 85% coverage

See [TEST_SUMMARY.md](./TEST_SUMMARY.md) for detailed testing documentation.

## Project Structure

```
notegit/
├── src/
│   ├── frontend/          # React UI components
│   │   ├── components/    # Reusable UI components
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # React entry point
│   ├── backend/           # Node.js backend services
│   │   ├── adapters/      # External service adapters (Git, FS, Crypto)
│   │   ├── services/      # Business logic services
│   │   ├── handlers/      # IPC request handlers
│   │   └── utils/         # Utility functions
│   ├── electron/          # Electron main process
│   │   ├── main.ts        # Main process entry
│   │   └── preload.ts     # Preload script (IPC bridge)
│   └── shared/            # Shared TypeScript types
│       └── types/         # Type definitions
├── dist/                  # Build output
└── package.json
```

## How to Use

### First-Time Setup

1. Launch notegit
2. Click "Connect to Repository"
3. Enter your Git repository details:
   - Remote URL (e.g., `https://github.com/username/notes.git`)
   - Branch name (e.g., `main`)
   - Personal Access Token

### Creating a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Tokens (classic)" → "Generate new token"
3. Give it a descriptive name (e.g., "notegit")
4. Select the `repo` scope (full control of private repositories)
5. Click "Generate token"
6. Copy the token and paste it into notegit

**Note**: Your token is stored encrypted in your app data directory, not in your operating system's keychain.

### Taking Notes

1. **Browse files**: Use the left sidebar to navigate your repository
2. **Edit notes**: Click any `.md` file to open it in the editor
3. **Save changes**: Click the save icon or press `Cmd/Ctrl+S`
4. **Commit**: Click the commit icon to commit changes with a custom message
5. **Sync**: Use the pull/push buttons in the status bar to sync with remote

### Keyboard Shortcuts

- `Cmd/Ctrl+S`: Save current file
- `Cmd/Ctrl+Shift+S`: Open commit dialog
- `Cmd/Ctrl+Enter` (in commit dialog): Commit and push

## Configuration

Settings are stored in your OS-specific app data directory:

- **macOS**: `~/Library/Application Support/notegit/`
- **Windows**: `%APPDATA%/notegit/`
- **Linux**: `~/.config/notegit/`

### Configuration Files

- `config/app-settings.json`: Application preferences
- `config/repo-settings.json`: Repository configuration (with encrypted PAT)
- `logs/`: Application logs
- `repos/`: Local clones of your repositories

## Architecture

### Backend Services

- **ConfigService**: Manages application and repository settings
- **RepoService**: Handles Git operations (clone, pull, push, auto-push)
- **FilesService**: File and folder CRUD operations
- **HistoryService**: Queries Git commit history

### Adapters

- **GitAdapter**: Wraps `simple-git` for Git CLI operations
- **FsAdapter**: File system operations
- **CryptoAdapter**: Encrypts/decrypts sensitive data (PAT)

### IPC Communication

The app uses Electron's IPC for secure communication between the renderer (React) and main process (Node.js). All communication is type-safe using shared TypeScript interfaces.

## Security

- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled in renderer process
- **Sandboxing**: Renderer process runs in sandbox mode
- **Credential Storage**: PATs encrypted using AES-256-GCM with machine-specific keys

## Auto-Push Mechanism

notegit automatically retries failed pushes:

1. When you commit, it immediately attempts to push
2. If push fails (e.g., offline), the commit is queued
3. A background timer checks connectivity every 30 seconds
4. When connection is restored, queued commits are automatically pushed
5. Status bar shows pending commit count

## Troubleshooting

### Git Not Found

If you see "Git is not installed", install Git for your platform:
- macOS: `brew install git`
- Windows: https://git-scm.com/downloads
- Linux: `sudo apt install git`

### Authentication Failed

- Ensure your Personal Access Token is valid
- Token must have `repo` scope
- For private repos, verify you have access

### Merge Conflicts

notegit doesn't handle merge conflicts automatically. If you get a conflict:

1. Open the repository in a Git client or terminal
2. Resolve conflicts manually
3. Return to notegit and refresh

## Building for Distribution

To package the app for distribution:

```bash
npm run package
```

This uses electron-builder to create platform-specific installers.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Roadmap

Future enhancements:
- Rich Markdown preview with diagrams
- Search across all notes
- Tag system
- Merge conflict resolution UI
- Branch switching
- Dark theme

---

Built with ❤️ using Electron, React, TypeScript, and Material-UI