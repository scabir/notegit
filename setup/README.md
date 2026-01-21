# Build Scripts for notegit

This folder contains build scripts to create distributable packages for macOS, Windows, and Linux.

## Prerequisites

1. Node.js and pnpm installed
2. All dependencies installed (`pnpm install`)
3. For cross-platform builds, you may need additional tools (see notes below)

## Usage

### Build for macOS

```bash
cd setup
chmod +x build-mac.sh
./build-mac.sh
```

**Output:**
- `notegit-{version}.dmg` - DMG installer for drag-and-drop installation
- `notegit-{version}-mac.zip` - ZIP archive for manual installation
- Both Intel (x64) and Apple Silicon (arm64) builds

### Build for Windows

```bash
cd setup
chmod +x build-windows.sh
./build-windows.sh
```

**Output:**
- `notegit Setup {version}.exe` - NSIS installer with wizard
- `notegit {version}.exe` - Portable executable (no installation needed)
- Both 64-bit (x64) and 32-bit (ia32) builds

### Build for Linux

```bash
cd setup
chmod +x build-linux.sh
./build-linux.sh
```

**Output:**
- `notegit-{version}.AppImage` - Universal Linux package
- `notegit_{version}_amd64.deb` - Debian/Ubuntu package
- `notegit-{version}.x86_64.rpm` - Fedora/RHEL/CentOS package

### Build for All Platforms

```bash
cd setup
chmod +x build-all.sh
./build-all.sh
```

This will attempt to build for all platforms. Note that cross-platform builds have limitations (see below).

## Output

All built installers are placed in the `release/` folder at the project root.
Released binaries for macOS, Windows, and Linux are available here:
https://drive.google.com/drive/folders/1kI5mWrkVu30ASVN2loQVWnXtE8MgXq4v

## Cross-Platform Building

### From macOS
- ✅ macOS: Native build (recommended)
- ✅ Windows: Cross-compilation supported
- ✅ Linux: Cross-compilation supported

### From Linux
- ❌ macOS: Not supported (requires macOS)
- ✅ Windows: Supported with Wine installed
- ✅ Linux: Native build (recommended)

### From Windows
- ❌ macOS: Not supported (requires macOS)
- ✅ Windows: Native build (recommended)
- ✅ Linux: WSL or Docker required

## Icons

The build configuration expects icons in the `build/` folder:
- `build/icon.icns` - macOS icon (512x512 recommended)
- `build/icon.ico` - Windows icon (256x256 recommended)
- `build/icon.png` - Linux icon (512x512 recommended)

If icons are not provided, electron-builder will use default icons.

## Customization

To customize the build configuration, edit the `"build"` section in `package.json`.

See electron-builder documentation for more options:
https://www.electron.build/configuration/configuration

## Code Signing

For distribution to end users, you should sign your applications:

- **macOS:** Requires Apple Developer certificate
- **Windows:** Requires code signing certificate
- **Linux:** Optional (AppImage can be signed)

Add signing configuration to `package.json` under the `"build"` section.

## Troubleshooting

### "Cannot find module" errors
Run `pnpm install` to ensure all dependencies are installed.

### Wine errors on Linux/macOS when building for Windows
Install Wine: `brew install wine-stable` (macOS) or `sudo apt install wine` (Linux)

### Build fails on first run
Try cleaning the project first: `pnpm run clean` and then rebuild.

### Large build size
The first build may be large due to Electron and dependencies. Consider:
- Using `asar` packing (enabled by default)
- Removing unused dependencies
- Implementing code splitting in the frontend

## CI/CD

For automated builds, consider using GitHub Actions or similar CI/CD platforms:

```yaml
# Example GitHub Actions workflow
name: Build
on: [push]
jobs:
  build-mac:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - run: pnpm install
      - run: ./setup/build-mac.sh
  
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - run: pnpm install
      - run: bash ./setup/build-windows.sh
  
  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: pnpm install
      - run: ./setup/build-linux.sh
```

## Support

For issues with electron-builder, see:
- Documentation: https://www.electron.build/
- GitHub: https://github.com/electron-userland/electron-builder
