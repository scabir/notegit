# Development

## Prerequisites

- Node.js 18+
- pnpm
- Git (for Git repos)
- S3 credentials (for S3 repos)

## Local dev

```bash
pnpm install
pnpm run dev
```

## Build and run

```bash
pnpm run build
pnpm start
```

### Dev console (optional)

Launch the app with DevTools open:

```bash
pnpm start -- --devtools
```

## Packaging

Build scripts live in `setup/`:

```bash
cd setup
./build-mac.sh
./build-windows.sh
./build-linux.sh
```

Outputs are written to `release/`:

- `notegit-{version}.dmg` and `notegit-{version}-mac.zip`
- `notegit Setup {version}.exe` and `notegit {version}.exe`
- `notegit-{version}.AppImage`, `notegit_{version}_amd64.deb`, `notegit-{version}.x86_64.rpm`

Released binaries:
https://drive.google.com/drive/folders/1kI5mWrkVu30ASVN2loQVWnXtE8MgXq4v
