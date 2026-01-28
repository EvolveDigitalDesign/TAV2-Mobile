# Test Module Resolution Fix

## Issue
Jest cannot resolve modules from `../../src/services/api` (index file) or direct file imports.

## Solution Applied
Reverted to direct file imports:
- `import apiClient from '../../src/services/api/client'`
- `import {...} from '../../src/services/api/cache'`

## If This Still Fails

### Option 1: Use Absolute Paths with Module Name Mapper
Update `jest.config.js`:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@services/(.*)$': '<rootDir>/src/services/$1',
},
```

Then in tests:
```typescript
import apiClient from '@services/api/client';
```

### Option 2: Check Jest Transform
Ensure TypeScript files are being transformed. The React Native preset should handle this, but verify:
```bash
npm test -- --no-cache
```

### Option 3: Verify File Existence
```bash
ls -la src/services/api/
# Should show: client.ts, cache.ts, index.ts
```

## Current Status
- ✅ App.test.tsx - PASSING
- ✅ AuthContext.test.tsx - PASSING  
- ✅ Button.test.tsx - PASSING
- ⚠️ client.test.ts - Module resolution issue
- ⚠️ cache.test.ts - Module resolution issue

The direct file imports should work. If they don't, it's likely a Jest transform or cache issue.
