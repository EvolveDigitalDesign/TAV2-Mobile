#!/bin/bash

# Check Xcode and iOS Runtime Setup
# This script checks if Xcode is properly configured and iOS runtimes are available

echo "🔍 Checking Xcode Setup..."
echo ""

# Check Xcode installation
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode command line tools not found"
    echo ""
    echo "Please run:"
    echo "   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer"
    exit 1
fi

echo "✅ Xcode found: $(xcodebuild -version | head -1)"
echo ""

# Check Xcode path
XCODE_PATH=$(xcode-select -p)
echo "📁 Xcode Path: $XCODE_PATH"
echo ""

# Check for iOS runtimes
echo "📱 Checking iOS Runtimes..."
RUNTIMES=$(xcrun simctl list runtimes 2>&1 | grep -i "iOS")

if [ -z "$RUNTIMES" ]; then
    echo "❌ No iOS runtimes found"
    echo ""
    echo "📥 To install iOS runtime:"
    echo "   1. Open Xcode: open -a Xcode"
    echo "   2. Go to Settings (Cmd + ,)"
    echo "   3. Click 'Platforms' tab"
    echo "   4. Download an iOS version (e.g., iOS 17.5)"
    echo ""
    echo "   Or use Xcode GUI:"
    echo "   - Window → Devices and Simulators (Cmd + Shift + 2)"
    echo "   - Click '+' to add simulator"
    echo "   - Xcode will prompt to download runtime if needed"
    exit 1
else
    echo "✅ Available iOS Runtimes:"
    echo "$RUNTIMES"
    echo ""
    
    # Check for iPad device types
    echo "📱 Checking iPad Device Types..."
    IPAD_TYPES=$(xcrun simctl list devicetypes | grep -i "iPad")
    
    if [ -z "$IPAD_TYPES" ]; then
        echo "❌ No iPad device types found"
    else
        echo "✅ Available iPad Types:"
        echo "$IPAD_TYPES" | head -5
        echo ""
        
        # Get latest runtime
        LATEST_RUNTIME=$(xcrun simctl list runtimes | grep -i "iOS" | tail -1 | awk -F'[()]' '{print $2}' | xargs)
        LATEST_IPAD=$(xcrun simctl list devicetypes | grep -i "iPad Pro (12.9-inch)" | head -1 | awk -F'[()]' '{print $2}' | xargs)
        
        if [ -n "$LATEST_RUNTIME" ] && [ -n "$LATEST_IPAD" ]; then
            echo "✅ Ready to create iPad simulator!"
            echo ""
            echo "Run this to create one:"
            echo "   xcrun simctl create \"TAV2 Mobile iPad\" \"$LATEST_IPAD\" \"$LATEST_RUNTIME\""
            echo "   xcrun simctl boot \"TAV2 Mobile iPad\""
            echo "   open -a Simulator"
        fi
    fi
fi

echo ""
echo "📋 Current Simulators:"
xcrun simctl list devices | grep -i ipad | head -5 || echo "   No iPad simulators found"
