#!/bin/bash

# Build script for all platforms
# Creates installers for macOS, Windows, and Linux

set -e

echo "🚀 Building notegit for all platforms..."
echo ""

# Get the project root (parent of setup directory)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Working directory: $PROJECT_ROOT"
echo ""

# Clean previous builds
echo "📦 Cleaning previous builds..."
npm run clean
rm -rf release

# Build the application
echo "🔨 Building application..."
npm run build

# Package for all platforms
echo "📦 Packaging for all platforms..."
npx electron-builder --mac --win --linux --x64 --arm64 --ia32

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 All installers created in ./release:"
ls -lh release/ 2>/dev/null || echo "No installers found"
echo ""
echo "⚠️  Note: Cross-platform builds may have limitations:"
echo "    - Building for macOS from Linux/Windows may not work"
echo "    - Building for Windows from macOS/Linux may need Wine"
echo ""
echo "For best results, build on the target platform or use CI/CD."

