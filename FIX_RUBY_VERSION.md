# Fix Ruby Version for CocoaPods

## Problem

Your system Ruby is version **2.6.10**, but CocoaPods requires **Ruby >= 3.0**.

## Solution Options

### Option 1: Use Homebrew Ruby (Recommended)

If you have Homebrew installed:

```bash
# Install Ruby via Homebrew
brew install ruby

# Add Homebrew Ruby to your PATH (add to ~/.zshrc)
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
echo 'export PATH="/opt/homebrew/lib/ruby/gems/3.3.0/bin:$PATH"' >> ~/.zshrc

# Reload shell
source ~/.zshrc

# Verify Ruby version
ruby --version
# Should show Ruby 3.x.x

# Install CocoaPods using Homebrew Ruby
gem install cocoapods
```

### Option 2: Use rbenv (Ruby Version Manager)

```bash
# Install rbenv via Homebrew
brew install rbenv ruby-build

# Initialize rbenv (add to ~/.zshrc)
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# Install Ruby 3.3.0
rbenv install 3.3.0

# Set as global version
rbenv global 3.3.0

# Verify
ruby --version

# Install CocoaPods
gem install cocoapods
```

### Option 3: Use System Ruby with Compatible CocoaPods Version

If you can't upgrade Ruby, use an older CocoaPods version:

```bash
# Install older ffi gem first
sudo gem install ffi -v 1.17.3

# Install older CocoaPods version
sudo gem install cocoapods -v 1.11.3
```

**Note:** This is not recommended as you'll miss newer features and bug fixes.

---

## Recommended: Quick Fix with Homebrew

If you have Homebrew, this is the fastest solution:

```bash
# 1. Install Ruby
brew install ruby

# 2. Update PATH (for Intel Mac, use /usr/local instead of /opt/homebrew)
# Check which one you have:
ls -la /opt/homebrew 2>/dev/null && echo "Apple Silicon" || echo "Intel"

# For Apple Silicon (M1/M2/M3):
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
echo 'export PATH="/opt/homebrew/lib/ruby/gems/3.3.0/bin:$PATH"' >> ~/.zshrc

# For Intel Mac:
# echo 'export PATH="/usr/local/opt/ruby/bin:$PATH"' >> ~/.zshrc
# echo 'export PATH="/usr/local/lib/ruby/gems/3.3.0/bin:$PATH"' >> ~/.zshrc

# 3. Reload shell
source ~/.zshrc

# 4. Verify
ruby --version

# 5. Install CocoaPods
gem install cocoapods

# 6. Verify CocoaPods
pod --version
```

---

## After Fixing Ruby

Once Ruby is updated and CocoaPods is installed, continue with iOS setup:

```bash
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile

# Generate iOS project (if not done)
cd /tmp
npx react-native@latest init TempProject --template react-native-template-typescript --skip-install
cp -r TempProject/ios /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/
rm -rf TempProject
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile

# Rename project if needed
cd ios
if [ -d "TempProject.xcodeproj" ]; then
  mv TempProject.xcodeproj TAV2Mobile.xcodeproj
  mv TempProject.xcworkspace TAV2Mobile.xcworkspace
  sed -i '' 's/TempProject/TAV2Mobile/g' TAV2Mobile.xcodeproj/project.pbxproj
fi
cd ..

# Install pods
cd ios
pod install
cd ..

# Run app
npm run ios
```

---

## Troubleshooting

### "command not found: brew"

Install Homebrew first:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### "Permission denied" when installing gems

Don't use `sudo` with Homebrew Ruby. If you get permission errors:
```bash
# Check gem path
gem env

# If needed, configure gem path
gem install --user-install cocoapods
```

### Still using old Ruby after PATH update

Make sure you:
1. Added PATH to `~/.zshrc` (not just current session)
2. Ran `source ~/.zshrc`
3. Opened a new terminal window

### Verify which Ruby is being used

```bash
which ruby
# Should show /opt/homebrew/opt/ruby/bin/ruby (Apple Silicon)
# or /usr/local/opt/ruby/bin/ruby (Intel)

ruby --version
# Should show 3.x.x
```
