# notegit

A Git-backed Markdown note-taking desktop application built with Electron, React, and TypeScript.

**Version**: 1.2.0  
**License**: MIT

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Download](#download)
  - [Building from Source](#building-from-source)
  - [Running the Application](#running-the-application)
- [User Guide](#user-guide)
- [Technical Details](#technical-details)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)

---

## Features

### Core Features
- ✅ **Git-Backed Storage** - Notes stored as plain Markdown files in a Git repository
- ✅ **Version Control** - Full Git history with commit viewing and per-file history
- ✅ **Markdown & Text Editor** - Support for `.md` and `.txt` files with live preview
- ✅ **File Management** - Create, rename, move, delete files and folders
- ✅ **Search & Replace** - Full-text search across all notes with regex support
- ✅ **Find & Replace** - Single-file and repo-wide find and replace
- ✅ **Auto-Save & Auto-Sync** - Invisible Git workflow with automatic commit/push
- ✅ **Import & Export** - Import files and export notes or entire repo as zip
- ✅ **Dark Theme** - System-aware dark mode with manual toggle
- ✅ **Encrypted Credentials** - Personal Access Tokens stored encrypted locally
- ✅ **Cross-Platform** - Runs on macOS, Windows, and Linux

### Advanced Features
- **Resizable Editor** - Split-pane Markdown editor with toggle preview
- **Formatting Toolbar** - Quick access to bold, italic, headings, lists, code
- **WYSIWYG Preview** - Edit directly in preview pane
- **History Viewer** - View previous versions of any file (read-only)
- **Keyboard Shortcuts** - Efficient navigation and search (Cmd/Ctrl+P, Cmd/Ctrl+F, etc.)
- **Move Operations** - Explicit move functionality for organizing files and folders

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

1. **Git** (required for the application to function)
   - **macOS**: `brew install git`
   - **Windows**: Download from [git-scm.com](https://git-scm.com/downloads)
   - **Linux**: `sudo apt install git` (Debian/Ubuntu) or `sudo dnf install git` (Fedora)
   - Verify: `git --version`

2. **Node.js** (version 18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version`

3. **npm** (comes with Node.js)
   - Verify: `npm --version`


### Building from Source

If you prefer to build from source or contribute to development:

#### 1. Clone the Repository

```bash
git clone https://github.com/scabir/notegit.git
cd notegit
```

#### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including Electron, React, TypeScript, and build tools.

#### 3. Build the Application

**For Development (with hot reload)**:
```bash
npm run dev
```
This starts Vite dev server on port 5173 and Electron in development mode.

**For Production Build**:
```bash
npm run build
```
This compiles TypeScript, bundles the frontend, and prepares the Electron app.

#### 4. Compile Platform-Specific Builds

Use the provided scripts in the `setup/` folder:

**macOS**:
```bash
cd setup
./build-mac.sh
```
Output: `dist/notegit-1.2.0.dmg` and `dist/notegit-1.2.0-mac.zip`

**Windows** (run on Windows or use cross-compilation):
```bash
cd setup
./build-windows.sh
```
Output: `dist/notegit-Setup-1.2.0.exe`

**Linux**:
```bash
cd setup
./build-linux.sh
```
Output: `dist/notegit-1.2.0.AppImage` and `dist/notegit-1.2.0.deb`

**All Platforms** (requires cross-compilation setup):
```bash
cd setup
./build-all.sh
```

### Running the Application

#### From Source

After building:
```bash
npm start
```

#### From Development Mode

```bash
npm run dev
```

This enables:
- Hot module replacement for React components
- Automatic restart on backend changes
- Chrome DevTools for debugging

#### From Compiled Binary

Simply double-click the application icon or run the executable from your terminal.

---

## User Guide

📖 **[Complete User Guide](./USER_GUIDE.md)** - Detailed instructions for using notegit

The user guide covers:
- First-time setup and repository connection
- Creating and editing notes
- File and folder management
- Search and find/replace operations
- Git synchronization
- Keyboard shortcuts
- Settings and customization
- Troubleshooting common issues

**Quick Start**: See the [User Guide](./USER_GUIDE.md#quick-start) for a 5-minute walkthrough.

---

## Technical Details

### Architecture Overview

notegit follows a modern Electron architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Renderer Process                      │
│  ┌────────────────────────────────────────────────┐    │
│  │         React Application (TypeScript)          │    │
│  │  - Material-UI Components                       │    │
│  │  - CodeMirror Editor                            │    │
│  │  - State Management (React Hooks)               │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │ IPC (Type-Safe)                     │
└───────────────────┼─────────────────────────────────────┘
                    │
┌───────────────────┼─────────────────────────────────────┐
│                   │       Main Process                   │
│  ┌────────────────▼───────────────────────────────┐    │
│  │              Preload Script                     │    │
│  │  - Exposes notegitApi to renderer              │    │
│  │  - Type-safe IPC bridge                        │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │                                      │
│  ┌────────────────▼───────────────────────────────┐    │
│  │            IPC Handlers                         │    │
│  │  - filesHandlers  - searchHandlers              │    │
│  │  - repoHandlers   - exportHandlers              │    │
│  │  - configHandlers - historyHandlers             │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │                                      │
│  ┌────────────────▼───────────────────────────────┐    │
│  │            Business Services                    │    │
│  │  - FilesService   - SearchService               │    │
│  │  - RepoService    - ExportService               │    │
│  │  - ConfigService  - HistoryService              │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │                                      │
│  ┌────────────────▼───────────────────────────────┐    │
│  │            Adapters                             │    │
│  │  - FsAdapter (File System)                      │    │
│  │  - GitAdapter (simple-git)                      │    │
│  │  - CryptoAdapter (AES-256-GCM)                  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Material-UI (MUI)** - Component library
- **CodeMirror 6** - Code editor with Markdown support
- **React Markdown** - Markdown rendering with `remark-gfm`
- **Vite** - Fast build tool and dev server

#### Backend
- **Electron** - Desktop app framework
- **Node.js** - Runtime environment
- **TypeScript** - Type-safe backend code
- **simple-git** - Git operations
- **archiver** - Zip file creation
- **node-machine-id** - Machine-specific encryption keys

#### Development Tools
- **Jest** - Testing framework
- **ts-jest** - TypeScript support for Jest
- **ESLint** - Code linting
- **electron-builder** - Application packaging

### Project Structure

```
notegit/
├── src/
│   ├── frontend/                 # React UI (Renderer Process)
│   │   ├── components/           # React components
│   │   │   ├── AboutDialog.tsx
│   │   │   ├── CommitDialog.tsx
│   │   │   ├── FileTreeView.tsx
│   │   │   ├── MarkdownEditor.tsx
│   │   │   ├── TextEditor.tsx
│   │   │   ├── SearchDialog.tsx
│   │   │   ├── RepoSearchDialog.tsx
│   │   │   ├── FindReplaceBar.tsx
│   │   │   ├── HistoryPanel.tsx
│   │   │   ├── SettingsDialog.tsx
│   │   │   ├── Workspace.tsx
│   │   │   └── ...
│   │   ├── utils/                # Frontend utilities
│   │   ├── App.tsx               # Root component
│   │   ├── main.tsx              # React entry point
│   │   └── index.html            # HTML template
│   │
│   ├── backend/                  # Node.js Backend (Main Process)
│   │   ├── adapters/             # External service wrappers
│   │   │   ├── FsAdapter.ts      # File system operations
│   │   │   ├── GitAdapter.ts     # Git CLI wrapper
│   │   │   └── CryptoAdapter.ts  # Encryption/decryption
│   │   ├── services/             # Business logic
│   │   │   ├── FilesService.ts   # File CRUD operations
│   │   │   ├── RepoService.ts    # Git repository management
│   │   │   ├── ConfigService.ts  # Configuration management
│   │   │   ├── HistoryService.ts # Git history queries
│   │   │   ├── SearchService.ts  # Search & replace
│   │   │   └── ExportService.ts  # Export functionality
│   │   ├── handlers/             # IPC request handlers
│   │   │   ├── filesHandlers.ts
│   │   │   ├── repoHandlers.ts
│   │   │   ├── configHandlers.ts
│   │   │   ├── searchHandlers.ts
│   │   │   ├── exportHandlers.ts
│   │   │   ├── historyHandlers.ts
│   │   │   └── dialogHandlers.ts
│   │   ├── utils/                # Backend utilities
│   │   │   └── logger.ts         # Winston logger
│   │   └── index.ts              # Main process entry
│   │
│   ├── electron/                 # Electron-specific code
│   │   ├── main.ts               # Electron main entry
│   │   └── preload.ts            # IPC bridge (context bridge)
│   │
│   └── shared/                   # Shared code (Frontend + Backend)
│       └── types/                # TypeScript type definitions
│           ├── api.ts            # IPC API types
│           ├── config.ts         # Configuration types
│           ├── files.ts          # File system types
│           ├── repo.ts           # Repository types
│           ├── history.ts        # History types
│           ├── repoSearch.ts     # Search types
│           └── index.ts          # Type exports
│
├── dist/                         # Build output
│   ├── frontend/                 # Compiled React app
│   ├── backend/                  # Compiled Node.js code
│   └── electron/                 # Compiled Electron code
│
├── setup/                        # Build scripts
│   ├── build-mac.sh
│   ├── build-windows.sh
│   ├── build-linux.sh
│   └── build-all.sh
│
├── __tests__/                    # Test files
├── package.json
├── tsconfig.json                 # Root TypeScript config
├── tsconfig.frontend.json        # Frontend TypeScript config
├── tsconfig.backend.json         # Backend TypeScript config
├── tsconfig.electron.json        # Electron TypeScript config
├── vite.config.ts                # Vite configuration
├── jest.config.js                # Jest configuration
└── README.md                     # This file
```

### Data Storage

Application data is stored in OS-specific directories:

- **macOS**: `~/Library/Application Support/notegit/`
- **Windows**: `%APPDATA%/notegit/`
- **Linux**: `~/.config/notegit/`

Directory structure:
```
notegit/
├── config/
│   ├── app-settings.json       # UI preferences, theme, autosave settings
│   └── repo-settings.json      # Repository config (encrypted PAT)
├── logs/
│   ├── main.log                # Application logs
│   └── error.log               # Error logs
└── repos/
    └── [repo-name]/            # Local clone of your repository
        ├── .git/               # Git metadata
        └── ...                 # Your markdown files
```

### IPC Communication

The application uses Electron's IPC (Inter-Process Communication) for secure communication between processes:

#### Type-Safe API

All IPC calls are type-safe through shared TypeScript interfaces defined in `src/shared/types/api.ts`:

```typescript
interface NotegitApi {
  files: {
    listTree: () => Promise<ApiResponse<FileTreeNode[]>>;
    readFile: (path: string) => Promise<ApiResponse<NoteContent>>;
    saveFile: (path: string, content: string, isAutosave?: boolean) => 
      Promise<ApiResponse<SaveResult>>;
    // ... more methods
  };
  repo: {
    getStatus: () => Promise<ApiResponse<RepoStatus>>;
    clone: (url: string, branch: string, pat: string) => 
      Promise<ApiResponse<void>>;
    // ... more methods
  };
  // ... more namespaces
}
```

#### Communication Flow

1. **Renderer → Main**:
   - React component calls `window.notegitApi.files.readFile(path)`
   - Preload script invokes `ipcRenderer.invoke('files:read', path)`
   - Main process handler receives request
   - Service processes request
   - Returns `ApiResponse<T>` with data or error

2. **Main → Renderer**:
   - Main process uses `mainWindow.webContents.send()` for events
   - Renderer listens via preload-exposed event handlers

### Security Features

#### Context Isolation
- **Enabled**: Renderer process runs in isolated context
- **Node Integration**: Disabled in renderer
- **Sandboxing**: Enabled for renderer process
- **Context Bridge**: Exposes only specific APIs via preload script

#### Credential Storage
- **Encryption**: AES-256-GCM for Personal Access Tokens
- **Key Derivation**: Machine-specific key using `node-machine-id`
- **Storage**: Encrypted tokens stored in config directory
- **No Keychain**: MVP stores in app directory (future: OS keychain integration)

#### Authentication Methods
- **HTTPS**: Personal Access Token (PAT) with encrypted storage
- **SSH**: System SSH agent (no credentials stored in app)

### Services Architecture

#### FilesService
- File and folder CRUD operations
- File tree generation
- Import/export files
- Move and rename operations
- Invisible Git workflow (save → commit → pull → push)
- Auto-save integration

#### RepoService
- Repository cloning
- Git status monitoring
- Pull and push operations
- Branch management
- Auto-push mechanism (retries failed pushes when connection restored)

#### SearchService
- Full-text search across markdown files
- Repo-wide search with regex and case sensitivity
- Single-file find and replace
- Repo-wide find and replace

#### HistoryService
- Per-file commit history
- Version retrieval (read-only)
- Commit metadata (author, date, message, hash)

#### ConfigService
- Application settings management
- Repository settings management
- Encrypted credential storage
- Settings persistence

#### ExportService
- Export current note as `.md` or `.txt`
- Export entire repository as `.zip` archive
- Dialog-based file selection

### Auto-Save & Auto-Sync

The application implements an "invisible Git workflow":

1. **Auto-Save**:
   - Triggers every 5 minutes (configurable)
   - Saves on app close
   - Debounced to avoid excessive saves during typing

2. **Auto-Commit**:
   - Every save triggers a commit
   - Commit message: "Update note: filename" or "Autosave: filename"

3. **Auto-Sync**:
   - After commit, attempts pull then push
   - If push fails (offline), queued for retry
   - Background timer checks connectivity every 30 seconds
   - Auto-pushes when connection restored

4. **Error Handling**:
   - Pull conflicts: User notified, manual resolution required
   - Push failures: Local changes preserved, retry mechanism engaged
   - Network errors: Gracefully handled with user feedback

### Testing

**Test Framework**: Jest with ts-jest for TypeScript support

**Coverage**:
- **Total Tests**: 107 passing
- **Test Suites**: 8 (all passing)
- **Coverage**: 5.84% (focused on business logic)

**Test Structure**:
```
src/__tests__/
├── adapters/
│   ├── FsAdapter.test.ts         # File system operations
│   ├── GitAdapter.test.ts        # Git operations
│   └── CryptoAdapter.test.ts     # Encryption/decryption
├── services/
│   ├── FilesService.test.ts      # File management
│   ├── ConfigService.test.ts     # Configuration
│   ├── HistoryService.test.ts    # Git history
│   ├── SearchService.test.ts     # Search & replace
│   └── ExportService.test.ts     # Export functionality
└── setup.ts                      # Test setup
```

**Run Tests**:
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

See [COVERAGE_REPORT.md](./COVERAGE_REPORT.md) for detailed coverage information.

### Build Process

The build process consists of three main steps:

1. **Frontend Build** (`npm run build:frontend`):
   - Vite bundles React app
   - Output: `dist/frontend/`

2. **Backend Build** (`npm run build:backend`):
   - TypeScript compiler for backend services
   - Output: `dist/backend/`

3. **Electron Build** (`npm run build:electron`):
   - TypeScript compiler for main process
   - Output: `dist/electron/`

4. **Import Path Fixing** (`npm run fix-imports`):
   - Post-build script to correct require paths
   - Adjusts module resolution for Electron

**Packaging**:
- Uses `electron-builder`
- Configured in `package.json` under `build` key
- Creates platform-specific installers and portable apps

### Electron Configuration

```json
{
  "main": "dist/electron/electron/main.js",
  "build": {
    "appId": "com.notegit.app",
    "productName": "notegit",
    "directories": {
      "output": "dist"
    },
    "files": [
      "dist/electron/**/*",
      "dist/frontend/**/*",
      "dist/backend/**/*",
      "package.json"
    ],
    "mac": {
      "target": ["dmg", "zip"],
      "category": "public.app-category.productivity"
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "category": "Office"
    }
  }
}
```

---

## Development

### Setting Up Development Environment

1. Clone and install dependencies (see [Building from Source](#building-from-source))

2. Start development server:
   ```bash
   npm run dev
   ```

3. Make changes:
   - Frontend changes: Auto-reload via Vite HMR
   - Backend changes: Restart Electron (Ctrl+R in app)

### Development Scripts

```bash
# Start development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint

# Start built app
npm start
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for TypeScript and React
- **Formatting**: Use consistent indentation and naming conventions
- **Comments**: Use JSDoc for public APIs

### Adding New Features

1. **Backend Service**:
   - Create service in `src/backend/services/`
   - Add IPC handler in `src/backend/handlers/`
   - Expose via preload script in `src/electron/preload.ts`
   - Add types to `src/shared/types/`

2. **Frontend Component**:
   - Create component in `src/frontend/components/`
   - Use TypeScript and React functional components
   - Follow Material-UI patterns
   - Add to main `Workspace.tsx` if needed

3. **Testing**:
   - Add unit tests for services
   - Place in `src/__tests__/`
   - Mock external dependencies

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- SearchService.test.ts

# Run with coverage report
npm test -- --coverage

# Watch mode (re-run on file changes)
npm run test:watch
```

### Test Coverage

Current coverage focuses on business logic:

- **SearchService**: 26.98% statements, 50% functions
- **ExportService**: 24.19% statements, 18.18% functions
- **Other Services**: Integration tested through application usage

**Note**: Low overall coverage (5.84%) is expected because:
- IPC handlers are thin integration layers (0% coverage)
- Adapters wrap external libraries (tested implicitly)
- Frontend components require E2E testing

See [COVERAGE_REPORT.md](./COVERAGE_REPORT.md) for detailed breakdown.

---

## Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs

1. Check existing [Issues](https://github.com/scabir/notegit/issues)
2. Create new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Node version)
   - Screenshots if applicable

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and use case
3. Discuss implementation approach

### Submitting Pull Requests

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes following code style
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open Pull Request with:
   - Clear description of changes
   - Reference to related issue
   - Screenshots/GIFs for UI changes

### Development Guidelines

- Write TypeScript, not JavaScript
- Use functional React components with hooks
- Follow existing code patterns and structure
- Add JSDoc comments for public APIs
- Write unit tests for new services
- Keep commits atomic and well-described
- Use normal hyphens (not em dashes) in code and comments

---

## License

MIT License

Copyright (c) 2025 Suleyman Cabir Ataman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Acknowledgments

Built with:
- [Electron](https://www.electronjs.org/) - Desktop app framework
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Material-UI](https://mui.com/) - React component library
- [CodeMirror](https://codemirror.net/) - Code editor
- [simple-git](https://github.com/steveukx/git-js) - Git operations
- [Vite](https://vitejs.dev/) - Build tool

---

**For detailed usage instructions, see the [User Guide](./USER_GUIDE.md).**

**For questions or support, open an [Issue](https://github.com/scabir/notegit/issues).**

Built with ❤️ by [Suleyman Cabir Ataman](https://github.com/scabir)
