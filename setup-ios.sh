#!/bin/bash

# iOS Setup Script for TAV2-Mobile
# Run this script to configure Xcode and set up the iOS project

set -e  # Exit on error

echo "🚀 Starting iOS Setup..."
echo ""

# Step 1: Configure Xcode Command Line Tools
echo "📦 Step 1: Configuring Xcode Command Line Tools..."
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Step 2: Accept Xcode License
echo "📝 Step 2: Accepting Xcode License..."
sudo xcodebuild -license accept

# Step 3: Verify Xcode Installation
echo "✅ Step 3: Verifying Xcode Installation..."
xcodebuild -version
echo ""

# Step 4: Install CocoaPods (if not installed)
echo "📦 Step 4: Installing CocoaPods..."
if ! command -v pod &> /dev/null; then
    echo "CocoaPods not found. Installing..."
    sudo gem install cocoapods
else
    echo "CocoaPods already installed: $(pod --version)"
fi
echo ""

# Step 5: Generate iOS Project Structure
echo "📁 Step 5: Generating iOS Project Structure..."
PROJECT_DIR="/Users/alec_work/Documents/development/GitHub/TAV2-Mobile"
TEMP_DIR="/tmp"

# Check if iOS project already exists
if [ -d "$PROJECT_DIR/ios/TAV2Mobile.xcodeproj" ] || [ -d "$PROJECT_DIR/ios/TAV2Mobile.xcworkspace" ]; then
    echo "⚠️  iOS project already exists. Skipping generation."
else
    echo "Creating temporary React Native project..."
    cd "$TEMP_DIR"
    npx react-native@latest init TempProject --template react-native-template-typescript --skip-install
    
    echo "Copying iOS folder to project..."
    cp -r TempProject/ios "$PROJECT_DIR/"
    
    echo "Cleaning up temporary project..."
    rm -rf TempProject
    
    echo "Renaming project files..."
    cd "$PROJECT_DIR/ios"
    if [ -d "TempProject.xcodeproj" ]; then
        mv TempProject.xcodeproj TAV2Mobile.xcodeproj
        echo "✅ Renamed xcodeproj"
    fi
    if [ -d "TempProject.xcworkspace" ]; then
        mv TempProject.xcworkspace TAV2Mobile.xcworkspace
        echo "✅ Renamed xcworkspace"
    fi
    
    # Update project name in project.pbxproj if needed
    if [ -f "TAV2Mobile.xcodeproj/project.pbxproj" ]; then
        sed -i '' 's/TempProject/TAV2Mobile/g' TAV2Mobile.xcodeproj/project.pbxproj
        echo "✅ Updated project references"
    fi
fi
echo ""

# Step 6: Update Podfile if needed
echo "📝 Step 6: Verifying Podfile..."
cd "$PROJECT_DIR/ios"
if grep -q "target 'TempProject'" Podfile 2>/dev/null; then
    echo "Updating Podfile target name..."
    sed -i '' "s/target 'TempProject'/target 'TAV2Mobile'/g" Podfile
    echo "✅ Updated Podfile"
fi
echo ""

# Step 7: Install Pods
echo "📦 Step 7: Installing CocoaPods Dependencies..."
echo "This may take 5-10 minutes on first run..."
pod install
echo ""

# Step 8: Verify Setup
echo "✅ Step 8: Verifying Setup..."
cd "$PROJECT_DIR"
if [ -d "ios/TAV2Mobile.xcworkspace" ]; then
    echo "✅ iOS workspace found: ios/TAV2Mobile.xcworkspace"
else
    echo "❌ iOS workspace not found!"
    exit 1
fi

if [ -d "ios/TAV2Mobile.xcodeproj" ]; then
    echo "✅ iOS project found: ios/TAV2Mobile.xcodeproj"
else
    echo "❌ iOS project not found!"
    exit 1
fi

echo ""
echo "🎉 iOS Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Start Metro bundler: npm start"
echo "2. Run iOS app: npm run ios"
echo ""
echo "Or run both in one command: npm run ios"
