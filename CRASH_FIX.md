# Fix App Crash on Launch

## Issue

The app crashes with:
```
Fatal error: Unexpectedly found nil while unwrapping an Optional value
at TAV2Mobile/AppDelegate.swift:16
```

## Root Cause

The `RCTBundleURLProvider` is returning `nil`, which means the Metro bundler might not be running or not accessible.

## Solution Applied

1. **Added proper nil handling** for the bundle URL
2. **Added fallback URL** if the provider returns nil
3. **Added better error messages** to help diagnose issues

## Steps to Fix

### 1. Make Sure Metro Bundler is Running

**Terminal 1** - Start Metro bundler:
```bash
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
npm start
```

You should see:
```
Metro waiting on exp://192.168.x.x:8081
```

### 2. Run the App

**Terminal 2** - Run the iOS app:
```bash
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
npm run ios
```

### 3. Verify Metro Connection

The app should connect to Metro on `http://localhost:8081`. If you see connection errors:

1. **Check Metro is running:**
   ```bash
   lsof -i :8081
   ```
   Should show node process listening on port 8081

2. **Check firewall/network:**
   - Make sure nothing is blocking localhost:8081
   - Try accessing `http://localhost:8081` in a browser

3. **Reset Metro cache:**
   ```bash
   npm start -- --reset-cache
   ```

## Updated AppDelegate

The new AppDelegate:
- Safely handles nil bundle URLs
- Falls back to direct localhost URL if provider fails
- Provides clear error messages

## Testing

After applying the fix:

1. **Clean build:**
   ```bash
   cd ios
   xcodebuild clean -workspace TAV2Mobile.xcworkspace -scheme TAV2Mobile
   cd ..
   ```

2. **Start Metro:**
   ```bash
   npm start
   ```

3. **Run app:**
   ```bash
   npm run ios
   ```

The app should now launch successfully!
