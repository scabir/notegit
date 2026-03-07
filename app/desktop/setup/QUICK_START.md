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

- `notegit-{version}.dmg`, `notegit-{version}-mac.zip`
- `notegit Setup {version}.exe`, `notegit {version}.exe`
- `notegit-{version}.AppImage`, `notegit_{version}_amd64.deb`, `notegit-{version}.x86_64.rpm`
