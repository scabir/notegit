# Quick Start: Building notegit

## One-Command Builds

### macOS (current platform)
```bash
cd setup && ./build-mac.sh
```

### Windows
```bash
cd setup && ./build-windows.sh
```

### Linux
```bash
cd setup && ./build-linux.sh
```

### All Platforms
```bash
cd setup && ./build-all.sh
```

## First Time Setup

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Make scripts executable** (if not already done):
   ```bash
   chmod +x setup/*.sh
   ```

3. **Build the app** (compile TypeScript):
   ```bash
   npm run build
   ```

4. **Run the build script** for your target platform(s)

## What Gets Created

After running a build script, you'll find installers in the `release/` folder:

### macOS
- `notegit-1.3.5.dmg` - Drag-and-drop installer
- `notegit-1.3.5-mac.zip` - Portable archive
- Universal build (works on Intel and Apple Silicon)

### Windows
- `notegit Setup 1.3.5.exe` - Full installer
- `notegit 1.3.5.exe` - Portable executable
- Both 32-bit and 64-bit versions

### Linux
- `notegit-1.3.5.AppImage` - Universal Linux package
- `notegit_1.3.5_amd64.deb` - Debian/Ubuntu package
- `notegit-1.3.5.x86_64.rpm` - Red Hat/Fedora package

## Distribution

Once built, you can:

1. **Test locally**: Install and run the package on your machine
2. **Share**: Upload to GitHub Releases, your website, etc.
3. **Auto-update**: Set up update server (requires additional configuration)

## Troubleshooting

### Build fails
```bash
# Clean and rebuild
npm run clean
npm run build
cd setup && ./build-mac.sh  # or your target platform
```

### Missing dependencies
```bash
npm install
```

### Permission denied
```bash
chmod +x setup/*.sh
```

## Next Steps

- **Add custom icon**: See `build/README.md`
- **Code signing**: Required for distribution (see main README)
- **Auto-updates**: Configure update server
- **CI/CD**: Automate builds with GitHub Actions

## Build Time

Typical build times:
- **macOS**: 2-5 minutes
- **Windows**: 2-5 minutes  
- **Linux**: 2-4 minutes
- **All platforms**: 5-10 minutes

First build may be slower due to downloading Electron binaries.

## File Sizes

Approximate installer sizes:
- **macOS DMG**: 150-250 MB (universal binary)
- **Windows EXE**: 100-150 MB
- **Linux AppImage**: 120-180 MB

The size is mainly due to Electron and Chromium.
