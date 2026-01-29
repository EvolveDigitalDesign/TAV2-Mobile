# Pre-Launch Checklist & Potential Issues

## ✅ Issues Fixed

### 1. Axios Node.js Build
- **Fixed:** Metro config now forces axios to use browser build
- **Action:** Restart Metro with `--reset-cache`

### 2. AppDelegate Crash
- **Fixed:** Added proper nil handling for bundle URLs
- **Status:** Ready

### 3. atob/btoa Browser APIs
- **Fixed:** Created base64 polyfill utility
- **Fixed:** Updated AuthContext to use `base64Decode` instead of `atob`
- **Status:** Ready

### 4. TypeScript Error in Input Component
- **Fixed:** Changed `error && styles.inputError` to `error ? styles.inputError : undefined`
- **Status:** Ready

### 5. Environment Configuration
- **Fixed:** Added try-catch for Platform import
- **Status:** Ready

---

## ⚠️ Potential Issues to Watch For

### 1. Navigation Types Mismatch
**Issue:** `MainTabParamList` defines `Projects` and `DailyRecords` tabs, but they're not implemented yet
**Status:** OK - They're commented as "will be added in Phase 6"
**Impact:** None - Only Dashboard and Profile tabs are used

### 2. Native Module Auto-Linking
**Dependencies that need native modules:**
- `@react-native-async-storage/async-storage` ✅ Auto-links
- `@react-native-community/netinfo` ✅ Auto-links
- `@react-native-community/datetimepicker` ✅ Auto-links
- `react-native-image-picker` ✅ Auto-links
- `react-native-screens` ✅ Auto-links
- `react-native-safe-area-context` ✅ Auto-links

**Action:** Verify `pod install` completed successfully

### 3. Environment Variables
**Issue:** Using `process.env.VITE_*` which may not work in React Native
**Status:** Has fallback defaults
**Impact:** Low - Defaults are set
**Future Fix:** Consider `react-native-config` if needed

### 4. API URL Configuration
**Current:** `http://localhost:8000` for iOS Simulator
**Requirements:**
- ✅ Backend must be running on `localhost:8000`
- ⚠️ For physical devices, will need machine's IP address
- ⚠️ For Android emulator, uses `10.0.2.2:8000`

### 5. Metro Bundler Cache
**Issue:** Old cache might cause module resolution issues
**Fix:** Always use `npm start -- --reset-cache` after config changes

---

## 📋 Pre-Launch Checklist

### Before Starting

- [ ] **Backend Running**
  ```bash
  # Verify backend is accessible
  curl http://localhost:8000/api/health/
  ```

- [ ] **iOS Simulator Ready**
  ```bash
  # Verify simulator is running
  xcrun simctl list devices | grep Booted
  ```

- [ ] **Dependencies Installed**
  ```bash
  npm install
  cd ios && pod install && cd ..
  ```

- [ ] **TypeScript Check**
  ```bash
  npm run type-check
  ```

- [ ] **Linting Check**
  ```bash
  npm run lint
  ```

### Starting the App

1. **Terminal 1 - Start Metro:**
   ```bash
   npm start -- --reset-cache
   ```
   Wait for: `Metro waiting on exp://...`

2. **Terminal 2 - Run iOS App:**
   ```bash
   npm run ios
   ```

### After App Launches

- [ ] App doesn't crash on startup
- [ ] Sign In screen displays
- [ ] Form validation works (try invalid email)
- [ ] Can see Metro logs in Terminal 1
- [ ] API connection works (check for network requests)
- [ ] Login works with valid credentials
- [ ] Navigation to Dashboard works
- [ ] Profile tab works
- [ ] Logout works

---

## 🔧 Quick Fixes

### If Metro Bundler Errors

```bash
# Clear all caches
npm start -- --reset-cache
watchman watch-del-all
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*
```

### If iOS Build Errors

```bash
# Clean and rebuild
cd ios
xcodebuild clean -workspace TAV2Mobile.xcworkspace -scheme TAV2Mobile
pod install
cd ..
npm run ios
```

### If API Connection Fails

1. **Check backend:**
   ```bash
   curl http://localhost:8000/api/health/
   ```

2. **Check Metro logs** for connection errors

3. **For physical device:** Update `API_URL` in `src/config/env.ts` to your machine's IP

### If App Crashes on Launch

1. **Check Xcode console** for native errors
2. **Check Metro logs** for JavaScript errors
3. **Verify all imports** are correct
4. **Check for missing components/screens**

---

## 🎯 Expected Behavior

### On First Launch
1. App opens to Sign In screen
2. No crashes
3. Form fields are visible and functional
4. "Sign In" button is visible

### After Login
1. Navigates to Dashboard
2. Shows user email/name
3. Tab bar visible at bottom
4. Can navigate to Profile tab
5. Profile shows user info and logout button

### Network
1. API calls go to `http://localhost:8000`
2. Requests include `Authorization: Bearer <token>` header
3. Token refresh works automatically

---

## 📝 Notes

- All critical issues have been fixed
- Base64 polyfill is in place
- Axios is configured for React Native
- Navigation structure is correct
- All required screens exist

The app should now launch successfully! 🚀
