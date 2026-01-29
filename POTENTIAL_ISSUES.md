# Potential Issues & Pre-Launch Checklist

## Issues Found & Fixed

### ✅ 1. Axios Node.js Build Issue
**Status:** FIXED
- **Problem:** Metro was resolving axios to Node.js build requiring `crypto`, `url`, `http` modules
- **Solution:** Updated `metro.config.js` to force axios to use browser build (`axios/dist/browser/axios.cjs`)
- **Action Required:** Restart Metro with `--reset-cache` flag

### ✅ 2. AppDelegate Crash
**Status:** FIXED
- **Problem:** AppDelegate was crashing due to nil optional unwrapping
- **Solution:** Updated AppDelegate to handle nil bundle URLs gracefully
- **Action Required:** None - already fixed

### ✅ 3. iOS Project Structure
**Status:** FIXED
- **Problem:** Missing iOS project files and schemes
- **Solution:** Generated iOS project and renamed to TAV2Mobile
- **Action Required:** None - already fixed

---

## Potential Issues to Watch For

### ⚠️ 1. `atob` Function in AuthContext
**Location:** `src/context/AuthContext.tsx:27`
**Issue:** `atob` is a browser API that might not be available in React Native
**Status:** NEEDS VERIFICATION
**Fix:** May need to use a polyfill or alternative JWT decoding

### ⚠️ 2. Environment Variable Access
**Location:** `src/config/env.ts:26`
**Issue:** Uses `require('react-native')` which should work, but `process.env.VITE_*` variables may not be available
**Status:** NEEDS VERIFICATION
**Fix:** May need to use `react-native-config` or `react-native-dotenv` for environment variables

### ⚠️ 3. Missing Native Module Linking
**Dependencies that need native linking:**
- `@react-native-async-storage/async-storage` - Should auto-link
- `@react-native-community/netinfo` - Should auto-link
- `@react-native-community/datetimepicker` - Should auto-link
- `react-native-image-picker` - Should auto-link
- `react-native-screens` - Should auto-link
- `react-native-safe-area-context` - Should auto-link

**Status:** Should be handled by `pod install`, but verify

### ⚠️ 4. Navigation Dependencies
**Status:** Should work, but verify:
- `@react-navigation/native` - Core navigation
- `@react-navigation/native-stack` - Stack navigator
- `@react-navigation/bottom-tabs` - Tab navigator
- `react-native-screens` - Native screen support
- `react-native-safe-area-context` - Safe area handling

### ⚠️ 5. API URL Configuration
**Location:** `src/config/env.ts`
**Issue:** Uses `localhost:8000` for iOS simulator
**Status:** Should work if backend is running on localhost:8000
**Action:** Verify backend is accessible

### ⚠️ 6. TypeScript Path Aliases
**Status:** Configured in `tsconfig.json` and `babel.config.js`
**Potential Issue:** Metro might not resolve `@/` aliases correctly
**Fix:** Already configured in babel.config.js, should work

### ⚠️ 7. Missing UI Components
**Status:** All required components exist:
- ✅ Button
- ✅ Input
- ✅ Card
- ✅ Badge
- ✅ Loading

### ⚠️ 8. Missing Screens
**Status:** All required screens exist:
- ✅ SignInScreen
- ✅ DashboardScreen
- ✅ ProfileScreen

---

## Pre-Launch Checklist

### Before Starting Metro
- [ ] Backend is running on `localhost:8000`
- [ ] iOS Simulator is running (or iPad simulator created)
- [ ] Xcode is properly configured
- [ ] CocoaPods dependencies installed (`pod install` completed)

### Before Running App
- [ ] Metro bundler started with `npm start -- --reset-cache`
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] All dependencies installed (`npm install`)

### After App Launches
- [ ] App doesn't crash on startup
- [ ] Sign In screen displays correctly
- [ ] Form validation works
- [ ] Can connect to backend API
- [ ] Login functionality works
- [ ] Navigation works after login
- [ ] Dashboard displays
- [ ] Profile screen displays
- [ ] Logout works

---

## Known Limitations

1. **Environment Variables:** Using `process.env.VITE_*` which may not work in React Native. Consider using `react-native-config` if needed.

2. **JWT Decoding:** Using `atob` which is a browser API. May need polyfill for React Native.

3. **Network Configuration:** Currently hardcoded to `localhost:8000` for iOS. For physical devices, will need machine's IP address.

---

## Quick Fixes for Common Issues

### If `atob` doesn't work:
```typescript
// Use a polyfill or alternative
import {decode as base64Decode} from 'base-64'; // npm install base-64
const payload = JSON.parse(base64Decode(token.split('.')[1]));
```

### If environment variables don't work:
```bash
npm install react-native-config
# Then use: import Config from 'react-native-config';
```

### If API connection fails:
1. Check backend is running: `curl http://localhost:8000/api/health/`
2. Check Metro logs for connection errors
3. For physical device, update API_URL to machine's IP

---

## Testing Checklist

1. **Start Metro:**
   ```bash
   npm start -- --reset-cache
   ```

2. **Run App:**
   ```bash
   npm run ios
   ```

3. **Test Sign In:**
   - Enter invalid email → Should show validation error
   - Enter valid email, invalid password → Should show error
   - Enter valid credentials → Should login and navigate to Dashboard

4. **Test Navigation:**
   - After login, should see Dashboard
   - Tap Profile tab → Should navigate to Profile
   - Tap Logout → Should return to Sign In

5. **Test API Connection:**
   - Check Metro logs for API calls
   - Verify requests go to `http://localhost:8000`
   - Check for CORS or network errors

---

## Emergency Fixes

If app crashes immediately:
1. Check Xcode console for native errors
2. Check Metro bundler logs for JavaScript errors
3. Verify all screens/components are imported correctly
4. Check for missing type definitions

If Metro bundler errors:
1. Clear cache: `npm start -- --reset-cache`
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Clear watchman: `watchman watch-del-all`
4. Clear Metro cache: `rm -rf /tmp/metro-*`

If iOS build errors:
1. Clean build: `cd ios && xcodebuild clean && cd ..`
2. Reinstall pods: `cd ios && pod install && cd ..`
3. Clear derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
