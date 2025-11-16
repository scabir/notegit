#!/bin/bash

# Build script for macOS
# Creates DMG and ZIP installers for both Intel (x64) and Apple Silicon (arm64)

set -e

echo "🍎 Building notegit for macOS..."
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

# Package for macOS
echo "📦 Packaging for macOS (Intel x64 and Apple Silicon arm64)..."
npx electron-builder --mac --x64 --arm64

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Installers created in ./release:"
ls -lh release/*.dmg release/*.zip 2>/dev/null || echo "No installers found"
echo ""
echo "Distribution files:"
echo "  - DMG: Drag-and-drop installer for macOS"
echo "  - ZIP: Portable archive for manual installation"

