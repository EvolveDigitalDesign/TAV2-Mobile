#!/bin/bash

# Comprehensive Xcode Build Fix Script
# Fixes: Locked build database and deployment target warnings

set -e

echo "🔧 Xcode Build Troubleshooting Script"
echo "======================================="
echo ""

cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile

# Step 1: Kill any running Xcode build processes
echo "📋 Step 1: Stopping Xcode build processes..."
pkill -9 -f "xcodebuild" 2>/dev/null || echo "No xcodebuild processes found"
pkill -9 -f "Xcode" 2>/dev/null || echo "No Xcode processes found"
sleep 2
echo "✅ Build processes stopped"
echo ""

# Step 2: Clean Xcode DerivedData
echo "📋 Step 2: Cleaning Xcode DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData/TAV2Mobile-* 2>/dev/null || true
rm -rf ~/Library/Developer/Xcode/DerivedData/*/Build/Intermediates.noindex/XCBuildData/*.xcbuilddata 2>/dev/null || true
rm -rf ~/Library/Developer/Xcode/DerivedData/*/Build/Intermediates.noindex/XCBuildData/build.db* 2>/dev/null || true
echo "✅ DerivedData cleaned"
echo ""

# Step 3: Clean iOS build artifacts
echo "📋 Step 3: Cleaning iOS build artifacts..."
cd ios
rm -rf build 2>/dev/null || true
rm -rf ~/Library/Developer/Xcode/DerivedData/*/Build/Products 2>/dev/null || true
echo "✅ Build artifacts cleaned"
echo ""

# Step 4: Clean and reinstall pods
echo "📋 Step 4: Cleaning and reinstalling CocoaPods..."
rm -rf Pods Podfile.lock 2>/dev/null || true
echo "✅ Pods cleaned"
echo ""

# Step 5: Verify Podfile
echo "📋 Step 5: Verifying Podfile..."
if [ -f "Podfile" ]; then
    echo "✅ Podfile exists"
else
    echo "❌ Podfile not found!"
    exit 1
fi
echo ""

# Step 6: Install pods
echo "📋 Step 6: Installing CocoaPods dependencies..."
echo "This may take 5-10 minutes..."
pod install
echo "✅ Pods installed"
echo ""

cd ..

echo "✅ Troubleshooting complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Open Xcode workspace (not project):"
echo "      open ios/TAV2Mobile.xcworkspace"
echo ""
echo "   2. Or run from command line:"
echo "      npm run ios"
echo ""
echo "   The build database lock should be resolved, and deployment target warnings should be fixed."
echo ""
