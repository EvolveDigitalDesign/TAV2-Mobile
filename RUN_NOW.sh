#!/bin/bash

# TAV2-Mobile Launch Script
# Handles PATH setup, Metro cache clearing, CocoaPods, and iOS launch

set -e

PROJECT_DIR="/Users/alec_work/Documents/development/GitHub/TAV2-Mobile"

echo "🔧 TAV2-Mobile Launch Script"
echo "============================="
echo ""

# Add Homebrew Ruby and CocoaPods to PATH for this session
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
export PATH="/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"

# Also add to .zshrc for future sessions
if ! grep -q "/opt/homebrew/lib/ruby/gems/4.0.0/bin" ~/.zshrc 2>/dev/null; then
    echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
    echo 'export PATH="/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"' >> ~/.zshrc
    echo "✅ Added to ~/.zshrc for future sessions"
fi

echo "📋 Step 1: Verifying CocoaPods..."
pod --version
echo ""

echo "📋 Step 2: Clearing Metro cache..."
cd "$PROJECT_DIR"
rm -rf "$TMPDIR/metro-"* 2>/dev/null || true
rm -rf "$TMPDIR/haste-"* 2>/dev/null || true
rm -rf "$TMPDIR/react-native-packager-cache-"* 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
echo "✅ Metro cache cleared"
echo ""

echo "📋 Step 3: Verifying Metro config..."
if [ -f "metro.config.js" ]; then
    node -c metro.config.js && echo "✅ metro.config.js is valid"
else
    echo "❌ metro.config.js not found!"
    exit 1
fi
echo ""

echo "📋 Step 4: Installing iOS dependencies..."
cd "$PROJECT_DIR/ios"

# Check if Podfile exists
if [ ! -f "Podfile" ]; then
    echo "⚠️  Podfile not found. Cannot continue."
    exit 1
fi

# Install pods if needed
if [ ! -d "Pods" ] || [ "Podfile" -nt "Pods/Manifest.lock" ]; then
    echo "Running pod install..."
    pod install
else
    echo "✅ Pods already installed and up to date"
fi
echo ""

echo "📋 Step 5: Cleaning Xcode build database (if locked)..."
rm -rf ~/Library/Developer/Xcode/DerivedData/TAV2Mobile-*/Build/Intermediates.noindex/XCBuildData/build.db 2>/dev/null || true
echo "✅ Xcode build database cleaned"
echo ""

echo "🚀 Step 6: Launching app with Metro cache reset..."
cd "$PROJECT_DIR"
npx react-native start --reset-cache &
METRO_PID=$!
sleep 5

echo ""
echo "📱 Launching iOS simulator..."
npx react-native run-ios

# Metro will continue running in background
echo ""
echo "ℹ️  Metro bundler is running in background (PID: $METRO_PID)"
echo "   To stop Metro, run: kill $METRO_PID"
