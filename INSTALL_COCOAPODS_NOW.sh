#!/bin/bash

# Install CocoaPods - Quick Fix Script
# This script detects your setup and installs CocoaPods correctly

set -e

echo "🔧 Installing CocoaPods..."
echo ""

# Check if Homebrew is installed
if command -v brew &> /dev/null; then
    echo "✅ Homebrew found"
    
    # Check if Ruby is installed via Homebrew
    if [ -d "/opt/homebrew/opt/ruby" ]; then
        # Apple Silicon
        echo "📱 Detected: Apple Silicon Mac"
        RUBY_BIN="/opt/homebrew/opt/ruby/bin"
        GEM_BIN="/opt/homebrew/lib/ruby/gems/3.3.0/bin"
        
        # Add to PATH for this session
        export PATH="$RUBY_BIN:$GEM_BIN:$PATH"
        
        # Add to .zshrc if not already there
        if ! grep -q "$RUBY_BIN" ~/.zshrc 2>/dev/null; then
            echo "export PATH=\"$RUBY_BIN:\$PATH\"" >> ~/.zshrc
            echo "export PATH=\"$GEM_BIN:\$PATH\"" >> ~/.zshrc
            echo "✅ Added Ruby to ~/.zshrc"
        fi
        
    elif [ -d "/usr/local/opt/ruby" ]; then
        # Intel Mac
        echo "💻 Detected: Intel Mac"
        RUBY_BIN="/usr/local/opt/ruby/bin"
        GEM_BIN="/usr/local/lib/ruby/gems/3.3.0/bin"
        
        # Add to PATH for this session
        export PATH="$RUBY_BIN:$GEM_BIN:$PATH"
        
        # Add to .zshrc if not already there
        if ! grep -q "$RUBY_BIN" ~/.zshrc 2>/dev/null; then
            echo "export PATH=\"$RUBY_BIN:\$PATH\"" >> ~/.zshrc
            echo "export PATH=\"$GEM_BIN:\$PATH\"" >> ~/.zshrc
            echo "✅ Added Ruby to ~/.zshrc"
        fi
    else
        echo "⚠️  Homebrew Ruby not found. Installing Ruby..."
        brew install ruby
        
        # Try again after install
        if [ -d "/opt/homebrew/opt/ruby" ]; then
            RUBY_BIN="/opt/homebrew/opt/ruby/bin"
            GEM_BIN="/opt/homebrew/lib/ruby/gems/3.3.0/bin"
        elif [ -d "/usr/local/opt/ruby" ]; then
            RUBY_BIN="/usr/local/opt/ruby/bin"
            GEM_BIN="/usr/local/lib/ruby/gems/3.3.0/bin"
        fi
        export PATH="$RUBY_BIN:$GEM_BIN:$PATH"
    fi
    
    echo ""
    echo "✅ Ruby version:"
    ruby --version
    
    echo ""
    echo "📦 Installing CocoaPods..."
    gem install cocoapods
    
    echo ""
    echo "✅ CocoaPods version:"
    pod --version
    
    echo ""
    echo "🎉 CocoaPods installed successfully!"
    echo ""
    echo "⚠️  IMPORTANT: Run this in your terminal:"
    echo "   source ~/.zshrc"
    echo ""
    echo "Then continue with:"
    echo "   cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/ios"
    echo "   pod install"
    echo "   cd .."
    echo "   npm run ios"
    
else
    echo "❌ Homebrew not found!"
    echo ""
    echo "Please install Homebrew first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo ""
    echo "Then add Homebrew to PATH:"
    echo "   For Apple Silicon: echo 'eval \"\$(/opt/homebrew/bin/brew shellenv)\"' >> ~/.zshrc"
    echo "   For Intel: echo 'eval \"\$(/usr/local/bin/brew shellenv)\"' >> ~/.zshrc"
    echo "   source ~/.zshrc"
    echo ""
    echo "Then run this script again."
    exit 1
fi
