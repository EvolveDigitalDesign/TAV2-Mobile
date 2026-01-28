#!/bin/bash

# Generate iOS Project Structure
# This script creates a temporary React Native project and copies the iOS folder

set -e

echo "🔧 Generating iOS Project Structure..."
echo ""

PROJECT_DIR="/Users/alec_work/Documents/development/GitHub/TAV2-Mobile"
TEMP_DIR="/tmp"

# Backup existing Podfile if it exists
if [ -f "$PROJECT_DIR/ios/Podfile" ]; then
    echo "📝 Backing up existing Podfile..."
    cp "$PROJECT_DIR/ios/Podfile" "$PROJECT_DIR/ios/Podfile.backup"
fi

# Remove existing ios directory (but keep Podfile backup)
if [ -d "$PROJECT_DIR/ios" ]; then
    echo "🗑️  Removing existing ios directory..."
    rm -rf "$PROJECT_DIR/ios"
fi

# Create temporary React Native project
echo "📦 Creating temporary React Native project..."
cd "$TEMP_DIR"
npx @react-native-community/cli@latest init TempProject --skip-install

# Copy iOS folder
echo "📁 Copying iOS folder..."
cp -r TempProject/ios "$PROJECT_DIR/"

# Clean up
echo "🧹 Cleaning up..."
rm -rf TempProject

# Rename project files
echo "✏️  Renaming project files..."
cd "$PROJECT_DIR/ios"

if [ -d "TempProject.xcodeproj" ]; then
    mv TempProject.xcodeproj TAV2Mobile.xcodeproj
    echo "✅ Renamed xcodeproj"
fi

if [ -d "TempProject.xcworkspace" ]; then
    mv TempProject.xcworkspace TAV2Mobile.xcworkspace
    echo "✅ Renamed xcworkspace"
fi

# Update project references in project.pbxproj
if [ -f "TAV2Mobile.xcodeproj/project.pbxproj" ]; then
    sed -i '' 's/TempProject/TAV2Mobile/g' TAV2Mobile.xcodeproj/project.pbxproj
    echo "✅ Updated project.pbxproj references"
fi

# Restore Podfile
if [ -f "$PROJECT_DIR/ios/Podfile.backup" ]; then
    echo "📝 Restoring Podfile..."
    mv "$PROJECT_DIR/ios/Podfile.backup" "$PROJECT_DIR/ios/Podfile"
    
    # Update Podfile target name if needed
    if grep -q "target 'TempProject'" "$PROJECT_DIR/ios/Podfile" 2>/dev/null; then
        sed -i '' "s/target 'TempProject'/target 'TAV2Mobile'/g" "$PROJECT_DIR/ios/Podfile"
        echo "✅ Updated Podfile target name"
    fi
fi

# Update Podfile to specify project
if ! grep -q "^project " "$PROJECT_DIR/ios/Podfile" 2>/dev/null; then
    echo ""
    echo "📝 Adding project path to Podfile..."
    # Add project line after platform line
    sed -i '' "/^platform :ios/a\\
project 'TAV2Mobile.xcodeproj'
" "$PROJECT_DIR/ios/Podfile"
    echo "✅ Added project path to Podfile"
fi

echo ""
echo "✅ iOS project structure generated!"
echo ""
echo "📦 Next: Install CocoaPods dependencies"
echo "   cd $PROJECT_DIR/ios"
echo "   export PATH=\"/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:\$PATH\""
echo "   pod install"
echo ""
echo "🚀 Then run the app:"
echo "   cd $PROJECT_DIR"
echo "   npm run ios"
