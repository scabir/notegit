#!/bin/bash

# Build script for Windows
# Creates NSIS installer and portable executable for Windows
# Note: This can be run from macOS/Linux for cross-platform building

set -e

echo "🪟 Building notegit for Windows..."
echo ""

# Get the project root (parent of setup directory)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Working directory: $PROJECT_ROOT"
echo ""

# Clean previous builds
echo "📦 Cleaning previous builds..."
pnpm run clean
rm -rf release

# Build the application
echo "🔨 Building application..."
pnpm run build

# Package for Windows
echo "📦 Packaging for Windows (x64 and ia32)..."
pnpm exec electron-builder --win --x64 --ia32

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Installers created in ./release:"
ls -lh release/*.exe 2>/dev/null || echo "No installers found"
echo ""
echo "Distribution files:"
echo "  - NSIS Installer: Full installer with uninstaller for Windows"
echo "  - Portable: Standalone executable (no installation required)"
echo ""
echo "⚠️  Note: If building from macOS/Linux, you may need Wine installed"
echo "    for code signing. For unsigned builds, this should work fine."
