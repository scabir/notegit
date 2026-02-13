# Testing

## Run tests

```bash
pnpm test
```

## Coverage

```bash
pnpm run test:coverage
```

Coverage reports are written to `coverage/` and include both frontend and backend unit tests.

Coverage gate checks can exclude file paths from threshold enforcement using:

- `scripts/coverage-gate-excludes.json` (default shared list)
- `COVERAGE_GATE_EXCLUDES=path1,path2` (env override)
- `--exclude <path>` and `--exclude-file <path>` CLI options

Example:

```bash
node scripts/check-coverage-threshold.js --exclude src/backend/foo.ts
```

## Watch mode

```bash
pnpm run test:watch
```

## Test layout

- `src/unit-tests/backend/`
- `src/unit-tests/frontend/`
- `src/unit-tests/setup.ts`

## Integration tests

```bash
pnpm run test:integration
```

Integration scenario catalog:

- [docs/testing/integration-tests.md](integration-tests.md)
