#!/bin/bash

# Quick Ruby Fix for CocoaPods
# This script installs Homebrew (if needed) and Ruby 3.x

set -e

echo "🔧 Fixing Ruby Version for CocoaPods..."
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH (for Apple Silicon)
    if [ -d "/opt/homebrew" ]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
        eval "$(/opt/homebrew/bin/brew shellenv)"
    # For Intel Mac
    elif [ -d "/usr/local/Homebrew" ]; then
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zshrc
        eval "$(/usr/local/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew already installed"
fi

echo ""
echo "📦 Installing Ruby 3.x via Homebrew..."
brew install ruby

echo ""
echo "🔧 Configuring PATH..."

# Detect Mac architecture
if [ -d "/opt/homebrew" ]; then
    # Apple Silicon
    RUBY_PATH="/opt/homebrew/opt/ruby/bin"
    GEM_PATH="/opt/homebrew/lib/ruby/gems/3.3.0/bin"
    echo "Detected: Apple Silicon Mac"
else
    # Intel
    RUBY_PATH="/usr/local/opt/ruby/bin"
    GEM_PATH="/usr/local/lib/ruby/gems/3.3.0/bin"
    echo "Detected: Intel Mac"
fi

# Add to .zshrc if not already there
if ! grep -q "$RUBY_PATH" ~/.zshrc 2>/dev/null; then
    echo "export PATH=\"$RUBY_PATH:\$PATH\"" >> ~/.zshrc
    echo "export PATH=\"$GEM_PATH:\$PATH\"" >> ~/.zshrc
    echo "✅ Added Ruby to PATH in ~/.zshrc"
fi

# Add to current session
export PATH="$RUBY_PATH:$PATH"
export PATH="$GEM_PATH:$PATH"

echo ""
echo "✅ Verifying Ruby version..."
ruby --version

echo ""
echo "📦 Installing CocoaPods..."
gem install cocoapods

echo ""
echo "✅ Verifying CocoaPods..."
pod --version

echo ""
echo "🎉 Ruby and CocoaPods setup complete!"
echo ""
echo "⚠️  IMPORTANT: Open a new terminal window or run:"
echo "   source ~/.zshrc"
echo ""
echo "Then continue with iOS setup:"
echo "   cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile"
echo "   cd ios && pod install && cd .."
echo "   npm run ios"
