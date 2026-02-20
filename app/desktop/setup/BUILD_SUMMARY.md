# Build Setup Summary

notegit v2.6.6 is ready to be packaged.

## Included

- `app/desktop/setup/` build scripts for macOS, Windows, Linux, and all platforms
- `app/desktop/release/` output directory
- `app/desktop/package.json` electron-builder config

## Outputs

- `notegit-{version}.dmg`, `notegit-{version}-mac.zip`
- `notegit Setup {version}.exe`, `notegit {version}.exe`
- `notegit-{version}.AppImage`, `notegit_{version}_amd64.deb`, `notegit-{version}.x86_64.rpm`

## Next steps

- Add icons in `build/` (optional)
- Set up code signing (recommended)
- Automate builds in CI (optional)
