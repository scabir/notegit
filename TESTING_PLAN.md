# notegit Testing Plan

## Testing Strategy

### Test Levels
1. **Unit Tests**: Individual functions and classes
2. **Integration Tests**: Service interactions with adapters
3. **IPC Tests**: Handler response formats

### Testing Framework
- **Jest**: Test runner and assertions
- **ts-jest**: TypeScript support
- **Mock implementations**: For external dependencies (Git, FS)

## Test Coverage Plan

### 1. Adapters (Critical - Core functionality)

#### FsAdapter
- ✓ Read file successfully
- ✓ Write file successfully
- ✓ Handle file not found errors
- ✓ Handle permission denied errors
- ✓ Create directory
- ✓ List directory contents
- ✓ Delete file
- ✓ Rename file
- ✓ Copy file
- ✓ Check file existence

#### GitAdapter
- ✓ Check Git installation
- ✓ Clone repository
- ✓ Get repository status
- ✓ Pull from remote
- ✓ Push to remote
- ✓ Add file to staging
- ✓ Commit changes
- ✓ Get commit log
- ✓ Show file at commit
- ✓ Handle authentication errors
- ✓ Handle network errors

#### CryptoAdapter
- ✓ Encrypt string
- ✓ Decrypt string
- ✓ Encryption produces different output each time (IV randomness)
- ✓ Decryption recovers original text
- ✓ Handle decryption of invalid data

### 2. Services (Critical - Business logic)

#### ConfigService
- ✓ Load default app settings
- ✓ Save app settings
- ✓ Update app settings
- ✓ Load repo settings with decryption
- ✓ Save repo settings with encryption
- ✓ Handle missing config files
- ✓ Merge settings with defaults
- ✓ Create config directory if not exists

#### RepoService
- ✓ Open existing repository
- ✓ Clone new repository
- ✓ Get repository status
- ✓ Pull from remote
- ✓ Push to remote
- ✓ Start auto-push timer
- ✓ Stop auto-push timer
- ✓ Auto-retry push when offline
- ✓ Extract repo name from URL

#### FilesService
- ✓ List file tree
- ✓ Read file content
- ✓ Save file
- ✓ Commit file
- ✓ Create new file
- ✓ Create folder
- ✓ Delete file
- ✓ Delete folder recursively
- ✓ Rename file
- ✓ Determine file type from extension
- ✓ Filter hidden files from tree
- ✓ Sort tree (folders first, then files)

#### HistoryService
- ✓ Get commit history for file
- ✓ Get file version at commit
- ✓ Get diff between commits
- ✓ Parse diff output
- ✓ Handle files with no history

### 3. Handlers (Medium - API contracts)

#### Config Handlers
- ✓ Return correct response format
- ✓ Handle errors gracefully
- ✓ Validate request parameters

#### Repo Handlers
- ✓ Return correct response format
- ✓ Handle Git errors
- ✓ Map error codes correctly

#### Files Handlers
- ✓ Return correct response format
- ✓ Handle file system errors
- ✓ Validate file paths

#### History Handlers
- ✓ Return correct response format
- ✓ Handle empty history

### 4. Utilities (Low - Helper functions)

#### Logger
- ✓ Log to file
- ✓ Respect log levels
- ✓ Format log entries

#### Error Mapping
- ✓ Map FS errors to ApiErrorCode
- ✓ Map Git errors to ApiErrorCode
- ✓ Preserve error details

## Test Data

### Mock Repository Structure
```
test-repo/
├── README.md
├── notes/
│   ├── note1.md
│   ├── note2.md
│   └── subfolder/
│       └── note3.md
├── images/
│   └── diagram.png
└── .git/
```

### Mock Git History
- 3-5 commits per file
- Various authors and dates
- Different commit messages

## Test Execution

### Commands
```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # Coverage report
```

### Coverage Targets
- Adapters: 90%+
- Services: 85%+
- Handlers: 80%+
- Overall: 80%+

## Priorities

### High Priority (Must Test)
1. CryptoAdapter (security critical)
2. GitAdapter (core functionality)
3. FilesService (data operations)
4. ConfigService (settings persistence)

### Medium Priority
5. RepoService
6. HistoryService
7. IPC Handlers

### Low Priority
8. Logger utilities
9. Error mapping helpers

