# Launch Error Anticipation & Troubleshooting Guide

## Current Error Fixed

### ✅ Metro Resolver Null Error
**Error:** `Cannot read properties of null (reading 'type')`
**Root Cause:** Custom resolver was returning `null` which Metro doesn't handle
**Fix:** Convert `null` to `undefined` when default resolver returns null

---

## Anticipated Launch Errors

### 1. Module Resolution Errors

#### Axios Node.js Build
**Error:** `Unable to resolve module crypto from axios/dist/node/axios.cjs`
**Status:** ✅ FIXED - Custom resolver forces browser build
**Prevention:** Metro config intercepts axios and uses `dist/browser/axios.cjs`

#### Other Node.js Dependencies
**Potential Errors:**
- `url`, `http`, `https`, `stream`, `util`, `buffer` modules not found
- Packages trying to use Node.js built-ins

**Prevention:**
- `blockList` in metro.config.js blocks `/dist/node/` and `/node/` paths
- Custom resolver can be extended for other packages if needed

**Dependencies to Watch:**
- `axios` ✅ Fixed
- `date-fns` - Should be fine (pure JS)
- `clsx` - Should be fine (pure JS)
- `@react-native-*` packages - React Native compatible

---

### 2. Native Module Linking Errors

#### AsyncStorage
**Error:** `Native module AsyncStorage is not found`
**Fix:** Run `cd ios && pod install && cd ..`
**Status:** Should auto-link, but verify pods are installed

#### React Navigation Dependencies
**Error:** `Native module react-native-screens is not found`
**Fix:** 
```bash
cd ios && pod install && cd ..
```
**Status:** Should auto-link

#### NetInfo
**Error:** `Native module NetInfo is not found`
**Fix:** Run `pod install`
**Status:** Should auto-link

**Prevention Checklist:**
- [ ] `cd ios && pod install` completed successfully
- [ ] No pod installation errors
- [ ] Xcode project includes `.xcworkspace` (not just `.xcodeproj`)

---

### 3. Environment Variable Errors

#### process.env Not Available
**Error:** `process.env.VITE_API_URL is undefined`
**Status:** ✅ Has fallback defaults in `src/config/env.ts`
**Impact:** Low - Defaults are set

**Potential Issues:**
- Environment variables may not work in React Native
- `process.env` might be limited

**Fix if Needed:**
```bash
npm install react-native-config
```

---

### 4. Navigation Errors

#### Navigation Container Not Found
**Error:** `NavigationContainer must be rendered inside a NavigationContainer`
**Status:** ✅ Fixed - NavigationContainer wraps AppNavigator
**Prevention:** Already implemented correctly

#### Screen Not Found
**Error:** `Screen 'Dashboard' is not defined`
**Status:** ✅ All screens exist and are registered
**Prevention:** Navigation structure is complete

---

### 5. Authentication Context Errors

#### useAuth Outside Provider
**Error:** `useAuth must be used within AuthProvider`
**Status:** ✅ Fixed - App.tsx wraps with AuthProvider
**Prevention:** Already implemented correctly

#### AsyncStorage Errors
**Error:** `AsyncStorage.getItem is not a function`
**Status:** Should work - package is installed
**Fix if Needed:** Verify `@react-native-async-storage/async-storage` is installed

---

### 6. TypeScript/Import Errors

#### Path Alias Not Resolved
**Error:** `Cannot find module '@/services/api/client'`
**Status:** ✅ Fixed - Babel and TypeScript configs include path aliases
**Prevention:** `@/` alias configured in both `babel.config.js` and `tsconfig.json`

#### Missing Type Definitions
**Error:** `Cannot find name 'React'` or type errors
**Status:** ✅ Fixed - TypeScript config includes React types
**Prevention:** `@types/react` installed and configured

---

### 7. Metro Bundler Errors

#### Cache Issues
**Error:** `Module not found` or stale cache
**Fix:** 
```bash
npm start -- --reset-cache
```

#### Port Already in Use
**Error:** `Port 8081 is already in use`
**Fix:**
```bash
lsof -ti:8081 | xargs kill -9
npm start
```

---

### 8. iOS Build Errors

#### CocoaPods Not Installed
**Error:** `pod: command not found`
**Fix:** Install CocoaPods (already done in setup)

#### Xcode Scheme Not Found
**Error:** `Could not find scheme TAV2Mobile`
**Status:** ✅ Fixed - Scheme renamed from TempProject
**Prevention:** Scheme file updated

#### Missing Bridging Header
**Error:** `Unable to find module React`
**Status:** ✅ Fixed - Bridging header created
**Prevention:** `TAV2Mobile-Bridging-Header.h` exists

---

### 9. Runtime Errors

#### Base64 Decoding
**Error:** `atob is not defined`
**Status:** ✅ Fixed - Created `base64Decode` polyfill
**Prevention:** `src/utils/base64.ts` exists and is used in AuthContext

#### Platform Detection
**Error:** `Platform.OS is undefined`
**Status:** ✅ Fixed - Added try-catch in env.ts
**Prevention:** Safe Platform import with fallback

---

## Quick Fix Commands

### Clear All Caches
```bash
# Metro cache
npm start -- --reset-cache

# Watchman cache
watchman watch-del-all

# Node modules (if needed)
rm -rf node_modules && npm install

# iOS build cache
cd ios && xcodebuild clean && cd ..
```

### Reinstall Dependencies
```bash
# JavaScript dependencies
npm install

# iOS dependencies
cd ios && pod install && cd ..
```

### Verify Setup
```bash
# Check Metro is running
lsof -i :8081

# Check TypeScript
npm run type-check

# Check linting
npm run lint
```

---

## Error Resolution Priority

1. **Metro Bundler Errors** - Most common, fix with cache reset
2. **Module Resolution** - Check metro.config.js and blockList
3. **Native Module Linking** - Run `pod install`
4. **TypeScript Errors** - Usually import/path issues
5. **Runtime Errors** - Check polyfills and Platform detection

---

## Success Indicators

When the app launches successfully, you should see:
- ✅ Metro bundler running on port 8081
- ✅ App opens to Sign In screen
- ✅ No red error screen
- ✅ Form fields are visible and functional
- ✅ Can type in email/password fields
- ✅ Sign In button is clickable

---

## Next Steps After Successful Launch

1. Test Sign In functionality
2. Verify API connection (check Metro logs)
3. Test navigation after login
4. Verify Dashboard displays
5. Test Profile tab
6. Test Logout functionality
