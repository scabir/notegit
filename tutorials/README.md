# notegit Tutorials

Playwright-generated end-user tutorials with step-by-step screenshots.

## How to use

1. Open a scenario folder under `tutorials/scenarios/`.
2. Read the scenario `README.md`.
3. Follow the steps and screenshots in order.

## Generate Tutorials

Run from repository root:

```bash
node tutorials/scripts/generate-connect-git-repository-tutorial.cjs
node tutorials/scripts/generate-git-create-and-edit-markdown-preview-split-tutorial.cjs
node tutorials/scripts/generate-git-organize-files-rename-move-duplicate-favorite-tutorial.cjs
node tutorials/scripts/generate-git-commit-pull-push-from-status-bar-tutorial.cjs
node tutorials/scripts/generate-git-view-history-and-restore-reference-tutorial.cjs
node tutorials/scripts/generate-git-export-note-and-export-repository-zip-tutorial.cjs
node tutorials/scripts/generate-connect-s3-bucket-with-prefix-tutorial.cjs
node tutorials/scripts/generate-s3-edit-and-auto-sync-pending-to-synced-tutorial.cjs
node tutorials/scripts/generate-s3-history-with-versioned-objects-tutorial.cjs
node tutorials/scripts/generate-local-create-repository-and-work-offline-tutorial.cjs
node tutorials/scripts/generate-local-save-and-reopen-persistence-check-tutorial.cjs
node tutorials/scripts/generate-global-switch-language-and-verify-persistence-tutorial.cjs
```

## Scenarios (Available)

- [[Git] Connect Git Repository](scenarios/connect-git-repository/README.md)
- [[Git] Create and Edit Markdown in Preview + Split](scenarios/create-and-edit-markdown-preview-split/README.md)
- [[Git] Organize Files: Rename, Move, Duplicate, Favorite](scenarios/organize-files-rename-move-duplicate-favorite/README.md)
- [[Git] Search and Replace (File and Repository)](scenarios/search-and-replace-file-and-repo/README.md)
- [[Git] Commit, Pull, Push from Status Bar](scenarios/commit-pull-push-from-status-bar/README.md)
- [[Git] View History and Restore Reference](scenarios/view-history-and-restore-reference/README.md)
- [[Git] Export Note and Export Repository ZIP](scenarios/export-note-and-export-repository-zip/README.md)
- [[AWS S3] Connect AWS S3 Bucket with Prefix](scenarios/connect-s3-bucket-with-prefix/README.md)
- [[AWS S3] Edit and Auto Sync (Pending to Synced)](scenarios/edit-and-auto-sync-pending-to-synced/README.md)
- [[AWS S3] History with Versioned Objects](scenarios/s3-history-with-versioned-objects/README.md)
- [[Local] Create Local Repository and Work Offline](scenarios/create-local-repository-and-work-offline/README.md)
- [[Local] Save and Reopen Persistence Check](scenarios/local-save-and-reopen-persistence-check/README.md)
- [[Global] Switch Language and Verify Persistence](scenarios/switch-language-and-verify-persistence/README.md)
- [How to Create a Repo on notegit](scenarios/create-repo-on-notegit/README.md)
- [Create a New Markdown File and Review in Preview + Split Mode](scenarios/create-file-markdown-preview-split/README.md)
- [Build a Linked Wiki in notegit and Host It Free on GitHub](scenarios/build-wiki-and-host-on-github/README.md)

## Scenario Roadmap

- [x] `[Git] connect-git-repository`
- [x] `[Git] create-and-edit-markdown-preview-split`
- [x] `[Git] organize-files-rename-move-duplicate-favorite`
- [ ] `[Git] search-and-replace-file-and-repo`
- [x] `[Git] commit-pull-push-from-status-bar`
- [x] `[Git] view-history-and-restore-reference`
- [x] `[Git] export-note-and-export-repository-zip`
- [x] `[AWS S3] connect-s3-bucket-with-prefix`
- [x] `[AWS S3] edit-and-auto-sync-pending-to-synced`
- [x] `[AWS S3] s3-history-with-versioned-objects`
- [x] `[Local] create-local-repository-and-work-offline`
- [x] `[Local] local-save-and-reopen-persistence-check`
- [x] `[Global] switch-language-and-verify-persistence`
