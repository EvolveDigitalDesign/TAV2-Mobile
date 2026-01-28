# Setup Native Projects (iOS & Android)

The iOS and Android native project folders need to be generated. Since we manually created the React Native project structure, we need to generate the native projects.

## Option 1: Use React Native CLI (Recommended)

Run this command in a temporary directory, then copy the `ios` and `android` folders:

```bash
# Create a temporary React Native project
cd /tmp
npx react-native@latest init TempProject --template react-native-template-typescript

# Copy the native folders to our project
cp -r TempProject/ios /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/
cp -r TempProject/android /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/

# Update the project name in native files
# (Search and replace "TempProject" with "TAV2Mobile" in ios/ and android/ folders)

# Clean up
rm -rf TempProject
```

## Option 2: Manual Setup (Current Partial Setup)

I've created basic Podfile and Android Gradle files. You'll need to:

1. **For iOS:**
   - Run `cd ios && pod install` (after copying full iOS project structure)
   - Or use Option 1 above

2. **For Android:**
   - The basic Gradle files are created
   - You'll need the full Android project structure from Option 1

## Quick Fix

The easiest solution is to run:

```bash
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
npx react-native init TempProject --template react-native-template-typescript --skip-install
# Then manually copy ios/ and android/ folders and update project names
```

Or use Expo's prebuild (if you want to switch to Expo):

```bash
npx create-expo-app@latest . --template blank-typescript
npx expo prebuild
```

## Current Status

- ✅ Basic Podfile created
- ✅ Basic Android Gradle files created
- ⚠️ Full native project structure needed

**Recommendation**: Use Option 1 to get the complete native project structure, then update project names.
