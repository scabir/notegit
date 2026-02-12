# Quick Start: Build

```bash
pnpm install
pnpm run build
cd setup && ./build-mac.sh
```

Other targets:

```bash
cd setup && ./build-windows.sh
cd setup && ./build-linux.sh
cd setup && ./build-all.sh
```

Artifacts land in `release/`:

- `notegit-{version}.dmg`, `notegit-{version}-mac.zip`
- `notegit Setup {version}.exe`, `notegit {version}.exe`
- `notegit-{version}.AppImage`, `notegit_{version}_amd64.deb`, `notegit-{version}.x86_64.rpm`
