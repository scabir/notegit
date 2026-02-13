# Build Scripts

Build installers for macOS, Windows, and Linux.

## Prereqs

- Node.js 18+
- pnpm
- `pnpm install`

## Usage

```bash
cd setup
./build-mac.sh
./build-windows.sh
./build-linux.sh
```

## Output

Artifacts are written to `release/`:

- `notegit-{version}.dmg`, `notegit-{version}-mac.zip`
- `notegit Setup {version}.exe`, `notegit {version}.exe`
- `notegit-{version}.AppImage`, `notegit_{version}_amd64.deb`, `notegit-{version}.x86_64.rpm`

Released binaries:
https://drive.google.com/drive/folders/1kI5mWrkVu30ASVN2loQVWnXtE8MgXq4v

## Notes

- Cross-platform builds work, but macOS builds must run on macOS.
- Icons are configured in `package.json` (default: `src/electron/resources/notegit.png`).
- Code signing is recommended for distribution.

## Troubleshooting

- Missing modules: `pnpm install`
- Clean rebuild: `pnpm run clean` then retry
- Windows build on macOS/Linux: install Wine
