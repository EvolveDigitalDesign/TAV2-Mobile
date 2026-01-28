#!/bin/bash

# Fix iOS Setup and Run App
# This ensures everything is set up correctly

set -e

PROJECT_DIR="/Users/alec_work/Documents/development/GitHub/TAV2-Mobile"

echo "🔧 Fixing iOS Setup..."
echo ""

cd "$PROJECT_DIR"

# 1. Ensure npm dependencies are installed
echo "📦 Checking npm dependencies..."
if [ ! -d "node_modules/@react-native-community/cli-platform-ios" ]; then
    echo "Installing npm dependencies..."
    npm install
else
    echo "✅ npm dependencies already installed"
fi

# 2. Set up PATH for CocoaPods
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"

# 3. Ensure TAV2Mobile directory exists
if [ ! -d "ios/TAV2Mobile" ] && [ -d "ios/TempProject" ]; then
    echo "📁 Renaming TempProject directory..."
    cd ios
    mv TempProject TAV2Mobile
    cd ..
    echo "✅ Renamed directory"
fi

# 4. Install pods
echo ""
echo "📦 Installing CocoaPods dependencies..."
cd ios
pod install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Launching app..."
npm run ios
