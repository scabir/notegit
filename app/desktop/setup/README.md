# Build Scripts

Build installers for macOS, Windows, and Linux.

## Prereqs

- Node.js 18+
- pnpm
- `cd app/desktop && pnpm install`

## Usage

```bash
cd app/desktop/setup
./build-mac.sh
./build-windows.sh
./build-linux.sh
```

## Output

Artifacts are written to `app/desktop/release/`:

- `NoteBranch-{version}.dmg`, `NoteBranch-{version}-mac.zip`
- `NoteBranch Setup {version}.exe`, `NoteBranch {version}.exe`
- `NoteBranch-{version}.AppImage`, `NoteBranch_{version}_amd64.deb`, `NoteBranch-{version}.x86_64.rpm`

Released binaries:
https://drive.google.com/drive/folders/1kI5mWrkVu30ASVN2loQVWnXtE8MgXq4v

## Notes

- Cross-platform builds work, but macOS builds must run on macOS.
- Icons are configured in `package.json` (default: `src/electron/resources/NoteBranch.png`).
- Code signing is recommended for distribution.

## Troubleshooting

- Missing modules: `cd app/desktop && pnpm install`
- Clean rebuild: `pnpm run clean` then retry
- Windows build on macOS/Linux: install Wine
