#!/bin/bash

# Run this to fix PATH and continue with iOS setup
# This works in your current terminal session

set -e

echo "🔧 Setting up PATH for CocoaPods..."
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

echo "✅ Verifying CocoaPods..."
pod --version

echo ""
echo "📦 Installing iOS dependencies..."
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/ios

# Check if Podfile exists
if [ ! -f "Podfile" ]; then
    echo "⚠️  Podfile not found. Generating iOS project first..."
    cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
    cd /tmp
    npx react-native@latest init TempProject --template react-native-template-typescript --skip-install
    cp -r TempProject/ios /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/
    rm -rf TempProject
    cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/ios
    
    # Rename if needed
    if [ -d "TempProject.xcodeproj" ]; then
        mv TempProject.xcodeproj TAV2Mobile.xcodeproj
        mv TempProject.xcworkspace TAV2Mobile.xcworkspace
        sed -i '' 's/TempProject/TAV2Mobile/g' TAV2Mobile.xcodeproj/project.pbxproj
    fi
fi

echo "Running pod install (this may take 5-10 minutes)..."
pod install

echo ""
echo "✅ iOS dependencies installed!"
echo ""
echo "🚀 Launching app..."
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
npm run ios
