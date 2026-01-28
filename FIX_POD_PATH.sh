#!/bin/bash

# Quick Fix: Add CocoaPods to PATH
# This script finds where pod is installed and adds it to PATH

set -e

echo "🔍 Finding CocoaPods installation..."
echo ""

# Add Homebrew Ruby to PATH
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"

# Find pod executable
POD_PATH=$(find /opt/homebrew/lib/ruby/gems -name "pod" -type f 2>/dev/null | grep "/bin/pod" | head -1)

if [ -z "$POD_PATH" ]; then
    echo "❌ CocoaPods not found. Installing..."
    gem install cocoapods
    POD_PATH=$(find /opt/homebrew/lib/ruby/gems -name "pod" -type f 2>/dev/null | grep "/bin/pod" | head -1)
fi

if [ -n "$POD_PATH" ]; then
    GEMS_BIN_DIR=$(dirname "$POD_PATH")
    echo "✅ Found CocoaPods at: $POD_PATH"
    echo "✅ Gems bin directory: $GEMS_BIN_DIR"
    
    # Add to PATH for this session
    export PATH="$GEMS_BIN_DIR:$PATH"
    
    # Add to .zshrc
    if ! grep -q "$GEMS_BIN_DIR" ~/.zshrc 2>/dev/null; then
        echo "export PATH=\"$GEMS_BIN_DIR:\$PATH\"" >> ~/.zshrc
        echo "✅ Added to ~/.zshrc"
    fi
    
    echo ""
    echo "✅ CocoaPods version:"
    pod --version
    
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Now run:"
    echo "   source ~/.zshrc"
    echo "   cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/ios"
    echo "   pod install"
else
    echo "❌ Could not find or install CocoaPods"
    exit 1
fi
