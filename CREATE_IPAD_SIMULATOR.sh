#!/bin/bash

# Create iPad Simulator
# This script creates an iPad simulator for testing

set -e

echo "📱 Creating iPad Simulator..."
echo ""

# Get the latest iOS runtime
RUNTIME=$(xcrun simctl list runtimes | grep -i "iOS" | tail -1 | awk -F'[()]' '{print $2}' | xargs)
if [ -z "$RUNTIME" ]; then
    echo "❌ No iOS runtime found. Please install Xcode and iOS simulators."
    exit 1
fi

echo "✅ Found iOS Runtime: $RUNTIME"
echo ""

# Get iPad device type (prefer iPad Pro 12.9-inch)
DEVICE_TYPE=$(xcrun simctl list devicetypes | grep -i "iPad Pro (12.9-inch)" | head -1 | awk -F'[()]' '{print $2}' | xargs)
if [ -z "$DEVICE_TYPE" ]; then
    # Fallback to any iPad
    DEVICE_TYPE=$(xcrun simctl list devicetypes | grep -i "iPad" | head -1 | awk -F'[()]' '{print $2}' | xargs)
fi

if [ -z "$DEVICE_TYPE" ]; then
    echo "❌ No iPad device type found."
    exit 1
fi

echo "✅ Found Device Type: $DEVICE_TYPE"
echo ""

# Create simulator name
SIMULATOR_NAME="TAV2 Mobile iPad"
EXISTING_SIM=$(xcrun simctl list devices | grep "$SIMULATOR_NAME" | head -1)

if [ -n "$EXISTING_SIM" ]; then
    echo "⚠️  Simulator '$SIMULATOR_NAME' already exists."
    echo ""
    echo "Available simulators:"
    xcrun simctl list devices | grep -i ipad
    echo ""
    echo "To use an existing simulator, run:"
    echo "   xcrun simctl boot \"$SIMULATOR_NAME\""
    echo "   open -a Simulator"
    exit 0
fi

# Create the simulator
echo "🔧 Creating simulator: $SIMULATOR_NAME"
echo "   Device Type: $DEVICE_TYPE"
echo "   Runtime: $RUNTIME"
echo ""

SIMULATOR_UDID=$(xcrun simctl create "$SIMULATOR_NAME" "$DEVICE_TYPE" "$RUNTIME" 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ Simulator created successfully!"
    echo "   UDID: $SIMULATOR_UDID"
    echo ""
    echo "🚀 Booting simulator..."
    xcrun simctl boot "$SIMULATOR_UDID" 2>&1 || echo "⚠️  Simulator may already be booted"
    
    echo ""
    echo "📱 Opening Simulator app..."
    open -a Simulator
    
    echo ""
    echo "✅ iPad Simulator is ready!"
    echo ""
    echo "Now you can run:"
    echo "   cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile"
    echo "   npm run ios"
else
    echo "❌ Failed to create simulator:"
    echo "$SIMULATOR_UDID"
    exit 1
fi
