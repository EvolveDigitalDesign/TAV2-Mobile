# Fix App Crash on Launch

## Changes Made

1. **Created Bridging Header** (`TAV2Mobile-Bridging-Header.h`)
   - This allows Swift to access React Native's Objective-C APIs
   - Imports necessary React Native headers

2. **Updated AppDelegate.swift**
   - Removed incorrect `import React` statement
   - Now uses bridging header to access React Native APIs

3. **Updated Xcode Project Settings**
   - Added `SWIFT_OBJC_BRIDGING_HEADER` to both Debug and Release configurations
   - Points to the bridging header file

## Next Steps

1. **Clean Build Folder:**
   ```bash
   cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/ios
   xcodebuild clean -workspace TAV2Mobile.xcworkspace -scheme TAV2Mobile
   ```

2. **Rebuild and Run:**
   ```bash
   cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
   npm run ios
   ```

## If Still Crashing

Check the crash logs in Xcode:
1. Open Xcode
2. Window → Devices and Simulators
3. Select your simulator
4. View Device Logs
5. Look for recent crash reports

Common issues:
- Metro bundler not running (should be on port 8081)
- Module name mismatch (should be "TAV2Mobile")
- Missing dependencies in Pods

## Verify Metro Bundler

Make sure Metro bundler is running:
```bash
npm start
```

Then in another terminal:
```bash
npm run ios
```
