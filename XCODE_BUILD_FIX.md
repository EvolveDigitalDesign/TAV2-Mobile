# Xcode Build Error Fix

## Error
```
error: unable to attach DB: error: accessing build database 
"/Users/.../DerivedData/.../build.db": database is locked 
Possibly there are two concurrent builds running in the same filesystem location.
```

## Root Causes

1. **Locked Build Database**: Xcode's build database was locked from a previous build that didn't clean up properly
2. **Deployment Target Warnings**: Some CocoaPods were using iOS 9.0 when the minimum supported is 12.0+
3. **Stale Build Artifacts**: Old build files causing conflicts

## Solutions Applied

### 1. Fixed Podfile Deployment Targets

Added a `post_install` hook to ensure all pods use iOS 13.4+ (React Native 0.74.5 minimum):

```ruby
post_install do |installer|
  react_native_post_install(...)
  
  # Fix deployment target warnings
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 13.4
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.4'
      end
    end
  end
end
```

### 2. Created Automated Fix Script

Created `fix-xcode-build.sh` that:
- Kills any running Xcode build processes
- Cleans Xcode DerivedData
- Cleans iOS build artifacts
- Reinstalls CocoaPods with correct deployment targets

## Quick Fix

Run the automated fix script:
```bash
./fix-xcode-build.sh
```

This will:
1. Stop any running builds
2. Clean all build caches
3. Reinstall pods with correct deployment targets
4. Prepare for a fresh build

## Manual Steps (if script doesn't work)

### Step 1: Kill Build Processes
```bash
pkill -9 -f "xcodebuild"
pkill -9 -f "Xcode"
```

### Step 2: Clean DerivedData
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/TAV2Mobile-*
```

### Step 3: Clean iOS Build
```bash
cd ios
rm -rf build Pods Podfile.lock
```

### Step 4: Reinstall Pods
```bash
pod install
```

### Step 5: Rebuild
```bash
cd ..
npm run ios
```

## Verification

After running the fix, you should see:
- ✅ No "database is locked" errors
- ✅ No deployment target warnings (9.0 -> 13.4)
- ✅ Clean build succeeds
- ✅ App launches in simulator

## Prevention

To prevent this issue:
1. Always let builds complete or cancel them properly
2. Don't run multiple builds simultaneously
3. Clean build folder if you see strange errors
4. Keep deployment targets consistent across all pods

## Related Files

- `ios/Podfile` - Updated with deployment target fix
- `fix-xcode-build.sh` - Automated troubleshooting script
- `XCODE_BUILD_FIX.md` - This document
