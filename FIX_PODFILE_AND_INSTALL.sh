#!/bin/bash

# Fix Podfile and Install Pods
# This script ensures npm dependencies are installed and then runs pod install

set -e

echo "🔧 Fixing Podfile and Installing Dependencies..."
echo ""

# Set up PATH for CocoaPods
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"

cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile

echo "📦 Ensuring npm dependencies are installed..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "Installing npm dependencies..."
    npm install
else
    echo "✅ npm dependencies already installed"
fi

echo ""
echo "📦 Installing CocoaPods dependencies..."
cd ios

# Try pod install
if pod install; then
    echo ""
    echo "✅ CocoaPods installed successfully!"
    echo ""
    echo "🚀 You can now run:"
    echo "   cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile"
    echo "   npm run ios"
else
    echo ""
    echo "❌ pod install failed. Trying to fix..."
    echo ""
    echo "Please run this manually:"
    echo "   cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile"
    echo "   npm install"
    echo "   cd ios"
    echo "   export PATH=\"/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:\$PATH\""
    echo "   pod install"
    exit 1
fi
