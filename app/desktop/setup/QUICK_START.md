# Quick Start: Build

```bash
cd app/desktop
pnpm install
pnpm run build
cd setup && ./build-mac.sh
```

Other targets:

```bash
cd app/desktop/setup && ./build-windows.sh
cd app/desktop/setup && ./build-linux.sh
```

Artifacts land in `app/desktop/release/`:

- `NoteBranch-{version}.dmg`, `NoteBranch-{version}-mac.zip`
- `NoteBranch Setup {version}.exe`, `NoteBranch {version}.exe`
- `NoteBranch-{version}.AppImage`, `NoteBranch_{version}_amd64.deb`, `NoteBranch-{version}.x86_64.rpm`
