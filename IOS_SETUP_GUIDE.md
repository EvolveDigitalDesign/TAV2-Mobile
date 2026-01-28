# iOS Simulator Setup & Testing Guide

## Quick Start (If iOS Project Exists)

If the `ios/` folder has a complete project structure:

```bash
# 1. Install Node dependencies
npm install

# 2. Install CocoaPods dependencies
cd ios
pod install
cd ..

# 3. Start Metro bundler (in one terminal)
npm start

# 4. Run on iOS Simulator (in another terminal)
npm run ios
```

---

## Full Setup (If iOS Project Needs Generation)

### Step 1: Check iOS Project Status

```bash
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
ls -la ios/
```

**If you see only `Podfile`** → You need to generate the full iOS project (see Step 2)

**If you see `*.xcodeproj` or `*.xcworkspace`** → Skip to Step 3

---

### Step 2: Generate iOS Project

Since React Native CLI doesn't support generating native projects for existing apps, we'll create a temporary project and copy the iOS folder:

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

The temporary project will be named "TempProject". You need to update it:

1. Open `ios/TempProject.xcodeproj` in Xcode (or rename the folder)
2. Or manually rename:
   ```bash
   cd ios
   mv TempProject.xcodeproj TAV2Mobile.xcodeproj
   mv TempProject.xcworkspace TAV2Mobile.xcworkspace
   # Update Podfile target name to 'TAV2Mobile'
   ```

---

### Step 3: Install Dependencies

```bash
# Install Node dependencies
npm install

# Install CocoaPods dependencies
cd ios
pod install
cd ..
```

**If CocoaPods is not installed:**
```bash
sudo gem install cocoapods
```

---

### Step 4: Configure Backend Connection

The app is already configured to use `http://localhost:8000` for iOS Simulator, which works automatically.

**Verify your backend is running:**
```bash
# In your backend directory (pnae-django)
python manage.py runserver 0.0.0.0:8000
```

**Important:** Use `0.0.0.0:8000` (not just `localhost:8000`) to allow connections from the simulator.

---

### Step 5: Start Metro Bundler

**Terminal 1** - Keep this running:

```bash
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
npm start
```

You should see:
```
Metro waiting on exp://192.168.x.x:8081
```

**Keep this terminal open** - Metro needs to be running for the app to work.

---

### Step 6: Run on iOS Simulator

**Terminal 2** - Run this command:

```bash
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
npm run ios
```

This will:
1. Build the iOS app
2. Launch iOS Simulator (if not already open)
3. Install the app
4. Launch the app

**First time may take 2-3 minutes** to build.

---

### Step 7: Test the App

#### Test Sign In Screen

1. **You should see:**
   - "TAV2 Mobile" title
   - "Sign In" subtitle
   - Email input field
   - Password input field
   - Sign In button

2. **Test Form Validation:**
   - Try submitting empty form → Should show validation errors
   - Enter invalid email (e.g., "test") → Should show email error
   - Enter short password (e.g., "123") → Should show password error

3. **Test Login:**
   - Enter valid email: `your-email@example.com`
   - Enter valid password: `your-password`
   - Tap "Sign In"
   - Should show loading state (button disabled, spinner)
   - On success → Navigate to Dashboard
   - On failure → Show error message

#### Test Navigation

1. **After successful login:**
   - Should see Dashboard screen
   - Should see "Profile" tab at bottom

2. **Navigate to Profile:**
   - Tap "Profile" tab
   - Should see:
     - Email
     - Name (if available)
     - Tenant name
     - Role
     - Logout button

3. **Test Logout:**
   - Tap "Logout" button
   - Should return to Sign In screen

---

## Troubleshooting

### "Command not found: pod"

Install CocoaPods:
```bash
sudo gem install cocoapods
```

### "No such file or directory: ios"

The iOS project is missing. Follow Step 2 above to generate it.

### "Could not connect to development server"

1. **Ensure Metro is running:**
   ```bash
   npm start
   ```

2. **Reload the app:**
   - In simulator, press `Cmd + D`
   - Select "Reload"
   - Or press `Cmd + R`

3. **Check Metro URL:**
   - Metro should show: `Metro waiting on exp://...`
   - If it shows a different IP, the simulator might not be able to reach it

### "Network request failed"

1. **Verify backend is running:**
   ```bash
   # Check if backend is accessible
   curl http://localhost:8000/api/health/
   ```

2. **Check backend is listening on 0.0.0.0:**
   ```bash
   # Backend should be started with:
   python manage.py runserver 0.0.0.0:8000
   ```

3. **Check app logs:**
   - In Metro terminal, look for API URL logs
   - Should show: `API URL: http://localhost:8000`

### Build Errors

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

4. **Rebuild:**
   ```bash
   npm run ios
   ```

### Simulator Won't Launch

1. **Open Xcode:**
   ```bash
   open -a Xcode
   ```

2. **Check available simulators:**
   - Xcode → Window → Devices and Simulators
   - Or: `xcrun simctl list devices`

3. **Manually open Simulator:**
   ```bash
   open -a Simulator
   ```

4. **Select a device:**
   - Hardware → Device → iPhone 15 Pro (or any available)

---

## Quick Reference Commands

```bash
# Install dependencies
npm install
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on iOS (in new terminal)
npm run ios

# Run on specific simulator
npm run ios -- --simulator="iPhone 15 Pro"

# Clear Metro cache
npm start -- --reset-cache

# Clean iOS build
cd ios && xcodebuild clean && cd ..

# Reinstall pods
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

---

## Developer Menu

While the app is running in the simulator:

- **Open Developer Menu:** Press `Cmd + D`
- **Reload App:** Press `Cmd + R`
- **Toggle Inspector:** Press `Cmd + I`

**Developer Menu Options:**
- Reload - Reload the JavaScript bundle
- Debug - Open Chrome DevTools
- Enable Fast Refresh - Auto-reload on code changes
- Show Element Inspector - Inspect UI elements
- Enable Performance Monitor - Show FPS and performance metrics

---

## Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] CocoaPods installed (`pod install`)
- [ ] Metro bundler running (`npm start`)
- [ ] Backend running on `0.0.0.0:8000`
- [ ] App launches in simulator
- [ ] Sign In screen displays
- [ ] Form validation works
- [ ] Can log in with valid credentials
- [ ] Dashboard displays after login
- [ ] Profile tab shows user info
- [ ] Logout works

---

## Next Steps

Once everything works:

1. **Test on Android Emulator** (uses `10.0.2.2:8000` automatically)
2. **Test on Physical Device** (requires your Mac's IP - see `DEVELOPMENT_NETWORKING.md`)
3. **Proceed to Phase 4** (Offline Mode)

---

## Need Help?

- Check `DEVELOPMENT_NETWORKING.md` for network issues
- Check `PHASE3_PROGRESS.md` for what's been implemented
- Review Metro bundler logs for JavaScript errors
- Check Xcode console for native errors
