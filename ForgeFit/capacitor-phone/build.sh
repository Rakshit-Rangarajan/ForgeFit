#!/bin/bash
# ForgeFit Phone APK Build Script
# Run from the capacitor-phone/ directory

set -e
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ForgeFit — Android Phone APK Builder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install from https://nodejs.org"; exit 1; }
command -v java >/dev/null 2>&1 || { echo "❌ Java not found. Install JDK 17 from https://adoptium.net"; exit 1; }

echo "✓ Node: $(node --version)"
echo "✓ Java: $(java -version 2>&1 | head -1)"

# Install dependencies
echo ""
echo "📦 Installing Capacitor..."
npm install

# Add Android platform if not exists
if [ ! -d "android" ]; then
  echo "📱 Adding Android platform..."
  npx cap add android
fi

# Generate icon assets if resources/ folder exists
if [ -d "resources" ]; then
  echo "🎨 Generating app icons..."
  npm run assets
fi

# Sync
echo "🔄 Syncing..."
npx cap sync android

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Ready! Next steps:"
echo ""
echo "  Option A — Android Studio (GUI):"
echo "    npx cap open android"
echo "    Build → Generate Signed Bundle / APK"
echo ""
echo "  Option B — Command line (debug APK):"
echo "    cd android && ./gradlew assembleDebug"
echo "    APK: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "  Install on connected phone:"
echo "    adb install android/app/build/outputs/apk/debug/app-debug.apk"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
