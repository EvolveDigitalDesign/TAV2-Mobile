# Fix Axios Node.js Module Error

## Issue

Metro bundler is trying to use the Node.js build of axios which requires Node.js built-in modules like `crypto`, `url`, `http`, etc. These don't exist in React Native.

Error:
```
Unable to resolve module crypto from /Users/.../node_modules/axios/dist/node/axios.cjs
```

## Solution Applied

Updated `metro.config.js` to:
1. **Block Node.js builds** - Prevents Metro from resolving to Node.js-specific builds
2. **Force axios resolution** - Explicitly resolves axios to the browser/React Native compatible build (`axios/dist/axios.js`)

## Next Steps

1. **Restart Metro bundler** (important - config changes require restart):
   ```bash
   # Stop Metro (Ctrl+C if running)
   # Then restart:
   npm start -- --reset-cache
   ```

2. **Run the app again:**
   ```bash
   npm run ios
   ```

## Why This Happens

Axios 1.9.0 has multiple builds:
- `dist/node/axios.cjs` - For Node.js (uses Node.js built-ins)
- `dist/axios.js` - For browsers/React Native (uses fetch/XHR)
- `dist/browser/axios.js` - Browser-specific build

Metro was accidentally resolving to the Node.js build. The fix forces it to use the React Native-compatible build.

## Verification

After restarting Metro, you should see:
- No more `crypto` module errors
- Axios working correctly in the app
- API calls functioning properly

## Alternative Solution (if above doesn't work)

If the Metro config doesn't work, you can also add this to `package.json`:

```json
{
  "browser": {
    "axios": "axios/dist/axios.js"
  }
}
```

But the Metro config approach is preferred for React Native.
