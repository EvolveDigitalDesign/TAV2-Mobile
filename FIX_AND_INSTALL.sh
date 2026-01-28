#!/bin/bash

# Complete Fix: Setup PATH and Install CocoaPods
# This script fixes the PATH and installs CocoaPods

set -e

echo "🔧 Setting up Ruby and CocoaPods..."
echo ""

# Add Homebrew to PATH (for Apple Silicon)
if [ -d "/opt/homebrew" ]; then
    echo "📱 Detected: Apple Silicon Mac"
    export PATH="/opt/homebrew/bin:$PATH"
    
    # Add to .zshrc if not already there
    if ! grep -q "/opt/homebrew/bin" ~/.zshrc 2>/dev/null; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
        echo "✅ Added Homebrew to ~/.zshrc"
    fi
    
    # Add Homebrew Ruby to PATH
    export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
    
    # Find the actual Ruby gems bin directory
    RUBY_VERSION=$(/opt/homebrew/opt/ruby/bin/ruby -e "puts Gem.ruby_version")
    GEMS_BIN="/opt/homebrew/lib/ruby/gems/${RUBY_VERSION}/bin"
    
    # Also check for user-installed gems
    USER_GEMS_BIN="$HOME/.gem/ruby/${RUBY_VERSION}/bin"
    
    export PATH="$GEMS_BIN:$USER_GEMS_BIN:$PATH"
    
    # Add to .zshrc if not already there
    if ! grep -q "/opt/homebrew/opt/ruby/bin" ~/.zshrc 2>/dev/null; then
        echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
        # Use gem env to get the correct path
        echo 'export PATH="$(/opt/homebrew/opt/ruby/bin/gem env gemdir)/bin:$PATH"' >> ~/.zshrc
        echo "✅ Added Ruby to ~/.zshrc"
    fi
fi

echo ""
echo "✅ Current Ruby version:"
ruby --version

echo ""
echo "📦 Installing CocoaPods..."
gem install cocoapods

echo ""
echo "✅ CocoaPods installed!"
pod --version

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Now you can run:"
echo "   cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/ios"
echo "   pod install"
echo "   cd .."
echo "   npm run ios"
