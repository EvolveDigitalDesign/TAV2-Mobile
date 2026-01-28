# iOS Setup - Action Required

## Current Status

❌ **iOS project structure is missing** - Only `Podfile` exists  
❌ **Xcode not configured** - Command line tools need to point to Xcode  
❌ **CocoaPods not installed** - Required for iOS dependencies  

---

## Step-by-Step Setup

### Step 1: Install/Configure Xcode

1. **Install Xcode** (if not installed):
   - Open Mac App Store
   - Search for "Xcode"
   - Install (this is large, ~15GB)

2. **Configure Xcode Command Line Tools:**
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -license accept
   ```

3. **Verify Xcode is working:**
   ```bash
   xcodebuild -version
   ```
   Should show version number

---

### Step 2: Install CocoaPods

```bash
sudo gem install cocoapods
```

**Verify installation:**
```bash
pod --version
```

---

### Step 3: Generate iOS Project

Since the iOS project structure is missing, generate it:

```bash
# Create temporary React Native project
cd /tmp
npx react-native@latest init TempProject --template react-native-template-typescript --skip-install

# Copy iOS folder to your project
cp -r TempProject/ios /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/

# Clean up
rm -rf TempProject

# Go back to your project
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
```

**Update Project Name:**

The temporary project will be named "TempProject". You need to update references:

```bash
cd ios

# Rename project files
if [ -d "TempProject.xcodeproj" ]; then
  mv TempProject.xcodeproj TAV2Mobile.xcodeproj
fi

if [ -d "TempProject.xcworkspace" ]; then
  mv TempProject.xcworkspace TAV2Mobile.xcworkspace
fi

# Update Podfile target name (should already be TAV2Mobile, but verify)
# The Podfile should have: target 'TAV2Mobile' do

cd ..
```

---

### Step 4: Install iOS Dependencies

```bash
cd ios
pod install
cd ..
```

This will:
- Install all native iOS dependencies
- Create `TAV2Mobile.xcworkspace`
- Set up the iOS project

**Note:** First time may take 5-10 minutes to download dependencies.

---

### Step 5: Verify Setup

```bash
# Check iOS project exists
ls -la ios/*.xcworkspace
ls -la ios/*.xcodeproj

# Should see:
# ios/TAV2Mobile.xcworkspace
# ios/TAV2Mobile.xcodeproj/
```

---

### Step 6: Run the App

**Terminal 1** - Metro bundler (already running):
```bash
npm start
```

**Terminal 2** - Run iOS:
```bash
npm run ios
```

---

## Quick Setup Script

You can run these commands in sequence:

```bash
# 1. Configure Xcode (if needed)
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# 2. Install CocoaPods (if needed)
sudo gem install cocoapods

# 3. Generate iOS project
cd /tmp
npx react-native@latest init TempProject --template react-native-template-typescript --skip-install
cp -r TempProject/ios /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/
rm -rf TempProject
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile

# 4. Rename project (if needed)
cd ios
if [ -d "TempProject.xcodeproj" ]; then
  mv TempProject.xcodeproj TAV2Mobile.xcodeproj
  mv TempProject.xcworkspace TAV2Mobile.xcworkspace
fi
cd ..

# 5. Install pods
cd ios
pod install
cd ..

# 6. Run app
npm run ios
```

---

## Troubleshooting

### "xcode-select: error: tool 'xcodebuild' requires Xcode"

**Solution:**
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### "pod: command not found"

**Solution:**
```bash
sudo gem install cocoapods
```

### "No such file or directory: ios"

The iOS folder wasn't copied correctly. Re-run Step 3.

### Build Errors After Setup

1. **Clean build:**
   ```bash
   cd ios
   xcodebuild clean
   cd ..
   ```

2. **Reinstall pods:**
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   ```

3. **Clear Metro cache:**
   ```bash
   npm start -- --reset-cache
   ```

---

## What Happens Next

After completing these steps:

1. ✅ iOS project will be generated
2. ✅ Dependencies will be installed
3. ✅ App will build and launch in simulator
4. ✅ You can test the Sign In screen
5. ✅ You can test login functionality

---

## Estimated Time

- Xcode installation: 30-60 minutes (if not installed)
- CocoaPods installation: 2-5 minutes
- iOS project generation: 2-3 minutes
- Pod install: 5-10 minutes (first time)
- First build: 2-5 minutes

**Total: ~45-90 minutes** (mostly Xcode download if needed)

---

## After Setup

Once the app launches:

1. **Test Sign In:**
   - Form validation
   - Login with credentials
   - Error handling

2. **Test Navigation:**
   - Dashboard after login
   - Profile tab
   - Logout

3. **Verify Backend Connection:**
   - Should connect to `http://localhost:8000` automatically
   - Check Metro logs for "API URL: http://localhost:8000"

---

## Need Help?

- See `IOS_SETUP_GUIDE.md` for detailed instructions
- See `DEVELOPMENT_NETWORKING.md` for network issues
- Check Metro bundler logs for JavaScript errors
- Check Xcode console for native errors
