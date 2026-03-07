# Testing

## Run tests

```bash
cd app/desktop
pnpm test
```

## Coverage

```bash
cd app/desktop
pnpm run test:coverage
```

Coverage reports are written to `app/desktop/coverage/` and include both frontend and backend unit tests.

Coverage gate checks can exclude file paths from threshold enforcement using:

- `app/desktop/scripts/coverage-gate-excludes.json` (default shared list)
- `COVERAGE_GATE_EXCLUDES=path1,path2` (env override)
- `--exclude <path>` and `--exclude-file <path>` CLI options

Example:

```bash
cd app/desktop
node scripts/check-coverage-threshold.js --exclude src/backend/foo.ts
```

## Watch mode

```bash
cd app/desktop
pnpm run test:watch
```

## Test layout

- `app/desktop/src/unit-tests/backend/`
- `app/desktop/src/unit-tests/frontend/`
- `app/desktop/src/unit-tests/setup.ts`

## Integration tests

```bash
cd app/desktop
pnpm run test:integration
```

Integration scenario catalog:

- [docs/testing/integration-tests.md](integration-tests.md)
