# Metro Error Troubleshooting Guide

## Error
```
Metro has encountered an error: While trying to resolve module `axios` from file `.../src/services/api/client.ts`, 
the package `.../node_modules/axios/package.json` was successfully found. However, this package itself specifies 
a `main` module field that could not be resolved (`.../node_modules/axios/dist/node/axios.cjs`).
```

## Root Cause

Axios's `package.json` has `"main": "./dist/node/axios.cjs"` which Metro tries to use by default. However:

1. The Node.js build requires Node.js built-in modules (`crypto`, `http`, etc.)
2. These modules don't exist in React Native
3. Previous fixes using `blockList` blocked the file but didn't provide an alternative
4. Previous custom resolvers returned `null`/`undefined` which Metro can't handle

### The Real Problem

- **blockList approach failed**: It blocks the file but doesn't redirect to an alternative
- **Custom resolver approach failed**: Returning `null`/`undefined` crashes Metro
- **Metro wasn't using exports field**: The `react-native` export condition wasn't being prioritized

## Solution Applied

### 1. Proper Custom Resolver with context.resolveRequest

```javascript
const config = {
  resolver: {
    // Enable package.json exports field support
    unstable_enablePackageExports: true,
    
    // Prioritize react-native condition
    unstable_conditionNames: ['react-native', 'browser', 'require', 'import', 'default'],
    
    // Custom resolver for axios
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'axios') {
        return {
          filePath: path.resolve(__dirname, 'node_modules/axios/dist/browser/axios.cjs'),
          type: 'sourceFile',
        };
      }
      // CRITICAL: Use context.resolveRequest to delegate (NOT return null)
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};
```

### Why This Works

1. **Explicit axios redirect**: Axios is always resolved to the browser-compatible build
2. **Proper delegation**: `context.resolveRequest()` properly delegates to Metro's default resolver
3. **Package exports enabled**: Metro can use the `react-native` condition for other packages
4. **No null/undefined**: The resolver always returns a valid object

### 2. Cache Clearing

Metro caches resolved modules. After fixing the config, you must:
- Clear Metro's cache
- Clear Watchman cache (if installed)
- Restart Metro with `--reset-cache` flag

## Troubleshooting Steps

### Quick Fix (Recommended)

Run the automated fix script:
```bash
./fix-metro-error.sh
```

Then start Metro:
```bash
npm start -- --reset-cache
```

### Manual Steps

1. **Stop Metro bundler** (if running):
   ```bash
   pkill -f "react-native.*start"
   pkill -f "metro"
   ```

2. **Clear Metro cache**:
   ```bash
   rm -rf $TMPDIR/metro-*
   rm -rf $TMPDIR/haste-*
   rm -rf /tmp/metro-*
   rm -rf /tmp/haste-*
   rm -rf node_modules/.cache
   rm -rf .metro
   ```

3. **Clear Watchman cache** (if installed):
   ```bash
   watchman watch-del-all
   ```

4. **Verify metro.config.js**:
   ```bash
   node -c metro.config.js
   ```

5. **Start Metro with cache reset**:
   ```bash
   npm start -- --reset-cache
   ```

6. **In a new terminal, run the app**:
   ```bash
   npm run ios
   ```

### If Problem Persists

1. **Reinstall node_modules**:
   ```bash
   rm -rf node_modules
   npm install
   ```

2. **Clear iOS build cache**:
   ```bash
   cd ios
   rm -rf build
   rm -rf Pods
   pod install
   cd ..
   ```

3. **Reset Metro completely**:
   ```bash
   npm start -- --reset-cache --verbose
   ```

4. **Check for conflicting Metro configs**:
   - Ensure only one `metro.config.js` exists
   - Check for Metro config in `package.json`
   - Verify no conflicting resolver plugins

## Verification

After applying the fix, you should see:
- ✅ Metro starts without errors
- ✅ No "Cannot read properties of undefined" errors
- ✅ Axios resolves correctly
- ✅ App builds and runs successfully

## Prevention

To prevent this issue in the future:
1. Always validate resolution objects before returning them
2. Never return `undefined` from custom resolvers
3. Use `null` to delegate to Metro's default resolution
4. Test Metro config changes with `--reset-cache` flag
5. Clear caches after modifying `metro.config.js`

## Related Files

- `metro.config.js` - Metro bundler configuration
- `fix-metro-error.sh` - Automated troubleshooting script
- `METRO_RESOLVER_FIX.md` - Previous resolver fix documentation

## Additional Resources

- [Metro Configuration Docs](https://facebook.github.io/metro/docs/configuration)
- [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
