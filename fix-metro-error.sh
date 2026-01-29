#!/bin/bash

# Comprehensive Metro Error Fix Script
# Fixes: Axios resolution errors and Metro bundler issues

set -e

echo "🔧 Metro Error Troubleshooting Script"
echo "======================================"
echo ""

cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile

# Step 1: Stop any running Metro processes
echo "📋 Step 1: Stopping Metro bundler..."
pkill -f "react-native.*start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2
echo "✅ Metro processes stopped"
echo ""

# Step 2: Clear Metro cache
echo "📋 Step 2: Clearing Metro bundler cache..."
rm -rf "${TMPDIR}metro-"* 2>/dev/null || true
rm -rf "${TMPDIR}haste-"* 2>/dev/null || true  
rm -rf "${TMPDIR}react-native-packager-cache-"* 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .metro 2>/dev/null || true
echo "✅ Metro cache cleared"
echo ""

# Step 3: Clear Watchman cache (if installed)
echo "📋 Step 3: Clearing Watchman cache..."
if command -v watchman &> /dev/null; then
    watchman watch-del-all 2>/dev/null || true
    echo "✅ Watchman cache cleared"
else
    echo "⚠️  Watchman not installed (optional)"
fi
echo ""

# Step 4: Patch axios for React Native
echo "📋 Step 4: Patching axios for React Native..."
node scripts/patch-axios.js
echo ""

# Step 5: Verify metro.config.js exists and is valid
echo "📋 Step 5: Verifying metro.config.js..."
if [ -f "metro.config.js" ]; then
    node -c metro.config.js && echo "✅ metro.config.js is valid"
else
    echo "❌ metro.config.js not found!"
    exit 1
fi
echo ""

# Step 6: Verify axios configuration
echo "📋 Step 6: Verifying axios configuration..."
node -e "
const pkg = require('./node_modules/axios/package.json');
console.log('axios main field:', pkg.main);
if (pkg.main === './dist/browser/axios.cjs') {
  console.log('✅ axios correctly configured for React Native');
} else {
  console.log('❌ axios still pointing to Node.js build!');
  process.exit(1);
}
const fs = require('fs');
if (fs.existsSync('./node_modules/axios/dist/browser/axios.cjs')) {
  console.log('✅ axios browser build file exists');
} else {
  console.log('❌ axios browser build file missing!');
  process.exit(1);
}
"
echo ""

# Step 7: Verify node_modules integrity
echo "📋 Step 7: Checking node_modules..."
if [ -d "node_modules" ] && [ -d "node_modules/react-native" ]; then
    echo "✅ node_modules appears intact"
else
    echo "⚠️  node_modules may be corrupted - running npm install..."
    npm install
fi
echo ""

echo "✅ Troubleshooting complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Start Metro with cache reset:"
echo "      npm start -- --reset-cache"
echo ""
echo "   2. In a new terminal, run the app:"
echo "      npm run ios"
echo ""
