#!/bin/bash
# ForgeFit Watch APK Build Script
# Run from the capacitor-watch/ directory

set -e
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ForgeFit — Wear OS APK Builder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm install

if [ ! -d "android" ]; then
  echo "⌚ Adding Android platform..."
  npx cap add android

  echo ""
  echo "⚠️  IMPORTANT — Before building, apply the Wear OS manifest:"
  echo "   Copy AndroidManifest.wear.xml over the generated manifest:"
  echo ""
  echo "   cp AndroidManifest.wear.xml android/app/src/main/AndroidManifest.xml"
  echo ""
  read -p "Press Enter after you've done this, or Ctrl+C to exit and do it manually..."
fi

npx cap sync android

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Ready! Build options:"
echo ""
echo "  Android Studio (select Wear OS device in emulator):"
echo "    npx cap open android"
echo ""
echo "  Command line debug:"
echo "    cd android && ./gradlew assembleDebug"
echo ""
echo "  Install on paired Wear OS watch via WiFi ADB:"
echo "    adb connect YOUR_WATCH_IP:5555"
echo "    adb -s YOUR_WATCH_IP:5555 install android/app/build/outputs/apk/debug/app-debug.apk"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
