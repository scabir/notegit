#!/bin/bash

# Build script for Linux
# Creates AppImage, DEB, and RPM packages for Linux distributions

set -e

echo "🐧 Building notegit for Linux..."
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

# Package for Linux
echo "📦 Packaging for Linux (x64)..."
pnpm exec electron-builder --linux --x64

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Installers created in ./release:"
ls -lh release/*.AppImage release/*.deb release/*.rpm 2>/dev/null || echo "No installers found"
echo ""
echo "Distribution files:"
echo "  - AppImage: Universal Linux package (works on most distributions)"
echo "  - DEB: Debian/Ubuntu package (apt-based systems)"
echo "  - RPM: Fedora/RHEL/CentOS package (yum/dnf-based systems)"
