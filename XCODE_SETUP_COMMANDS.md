# Xcode Setup Commands

## Quick Setup (Run These Commands)

Run these commands in your terminal **one at a time**:

### 1. Configure Xcode Command Line Tools
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### 2. Accept Xcode License
```bash
sudo xcodebuild -license accept
```

### 3. Verify Xcode is Working
```bash
xcodebuild -version
```
You should see something like: `Xcode 15.x` or similar.

### 4. Install CocoaPods
```bash
sudo gem install cocoapods
```

### 5. Verify CocoaPods Installation
```bash
pod --version
```
You should see a version number like `1.15.x`.

---

## Automated Setup Script

Alternatively, you can run the automated setup script:

```bash
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
./setup-ios.sh
```

This script will:
- ✅ Configure Xcode command line tools
- ✅ Accept Xcode license
- ✅ Install CocoaPods (if needed)
- ✅ Generate iOS project structure
- ✅ Install iOS dependencies
- ✅ Verify everything is set up correctly

---

## Manual Step-by-Step (If Script Fails)

### Step 1: Configure Xcode
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
xcodebuild -version
```

### Step 2: Install CocoaPods
```bash
sudo gem install cocoapods
pod --version
```

### Step 3: Generate iOS Project
```bash
# Create temporary project
cd /tmp
npx react-native@latest init TempProject --template react-native-template-typescript --skip-install

# Copy iOS folder
cp -r TempProject/ios /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/

# Clean up
rm -rf TempProject

# Go back to project
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
```

### Step 4: Rename Project Files
```bash
cd ios

# Rename if needed
if [ -d "TempProject.xcodeproj" ]; then
  mv TempProject.xcodeproj TAV2Mobile.xcodeproj
  mv TempProject.xcworkspace TAV2Mobile.xcworkspace
fi

# Update project references
if [ -f "TAV2Mobile.xcodeproj/project.pbxproj" ]; then
  sed -i '' 's/TempProject/TAV2Mobile/g' TAV2Mobile.xcodeproj/project.pbxproj
fi

cd ..
```

### Step 5: Update Podfile
```bash
cd ios
# Check if Podfile needs updating
grep "target 'TempProject'" Podfile
# If found, update it:
sed -i '' "s/target 'TempProject'/target 'TAV2Mobile'/g" Podfile
cd ..
```

### Step 6: Install Pods
```bash
cd ios
pod install
cd ..
```

### Step 7: Verify Setup
```bash
ls -la ios/*.xcworkspace
ls -la ios/*.xcodeproj
```

You should see:
- `ios/TAV2Mobile.xcworkspace`
- `ios/TAV2Mobile.xcodeproj/`

---

## Troubleshooting

### "xcode-select: error: tool 'xcodebuild' requires Xcode"
**Solution:** Make sure Xcode is fully installed and run:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### "xcodebuild: error: You have not agreed to the Xcode license"
**Solution:** Run:
```bash
sudo xcodebuild -license accept
```

### "pod: command not found"
**Solution:** Install CocoaPods:
```bash
sudo gem install cocoapods
```

### "Operation not permitted" or Permission Errors
**Solution:** Make sure you're using `sudo` for system-level commands.

### First Time Opening Xcode
If this is the first time opening Xcode, you may need to:
1. Open Xcode.app manually
2. Accept additional agreements
3. Install additional components (Xcode will prompt you)

---

## After Setup

Once all commands complete successfully:

1. **Start Metro bundler** (if not already running):
   ```bash
   npm start
   ```

2. **Run iOS app**:
   ```bash
   npm run ios
   ```

The app should build and launch in the iOS Simulator!

---

## Expected Output

After running the setup, you should see:

```
✅ Xcode version: Xcode 15.x
✅ CocoaPods version: 1.15.x
✅ iOS workspace: ios/TAV2Mobile.xcworkspace
✅ iOS project: ios/TAV2Mobile.xcodeproj
✅ Pods installed successfully
```

---

## Next Steps

After setup is complete:
- See `SETUP_IOS_NOW.md` for testing instructions
- See `IOS_SETUP_GUIDE.md` for detailed iOS development guide
- See `DEVELOPMENT_NETWORKING.md` for network configuration
