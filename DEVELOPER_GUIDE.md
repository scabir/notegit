# notegit Developer's Guide

This guide is for contributors and engineers working on notegit.

## Prerequisites

- Node.js 18+
- `pnpm`
- Git

## Project Setup

```bash
cd app/desktop
pnpm install
```

## Run in Development

```bash
cd app/desktop
pnpm run dev
```

## Build

```bash
cd app/desktop
pnpm run build
```

## Run Built App

```bash
cd app/desktop
pnpm start
```

Optional with DevTools:

```bash
cd app/desktop
pnpm start -- --devtools
```

## Quality Checks

```bash
cd app/desktop
pnpm run lint
pnpm run test
pnpm run test:coverage
pnpm run test:integration
```

## Package Installers

```bash
cd app/desktop
pnpm run package
```

Platform-specific build helpers:

```bash
cd app/desktop/setup
./build-mac.sh
./build-windows.sh
./build-linux.sh
```

## Technical Docs

- Architecture: [docs/architecture/README.md](docs/architecture/README.md)
- Development notes: [docs/development/README.md](docs/development/README.md)
- Testing: [docs/testing/README.md](docs/testing/README.md)
- Integration scenario catalog: [docs/testing/integration-tests.md](docs/testing/integration-tests.md)
