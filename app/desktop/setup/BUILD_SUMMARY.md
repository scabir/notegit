# Build Setup Summary

NoteBranch v2.6.6 is ready to be packaged.

## Included

- `app/desktop/setup/` build scripts for macOS, Windows, Linux, and all platforms
- `app/desktop/release/` output directory
- `app/desktop/package.json` electron-builder config

## Outputs

- `NoteBranch-{version}.dmg`, `NoteBranch-{version}-mac.zip`
- `NoteBranch Setup {version}.exe`, `NoteBranch {version}.exe`
- `NoteBranch-{version}.AppImage`, `NoteBranch_{version}_amd64.deb`, `NoteBranch-{version}.x86_64.rpm`

## Next steps

- Add icons in `build/` (optional)
- Set up code signing (recommended)
- Automate builds in CI (optional)
