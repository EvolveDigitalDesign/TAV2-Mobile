# Install iOS Runtime for Simulators

## Problem

No iOS runtime found. This means Xcode is installed but the iOS simulator runtimes need to be downloaded.

## Solution

### Option 1: Download via Xcode (Recommended)

1. **Open Xcode**
   ```bash
   open -a Xcode
   ```

2. **Go to Settings/Preferences:**
   - Press `Cmd + ,` (or Xcode → Settings)
   - Click on **"Platforms"** tab (or **"Components"** in older versions)

3. **Download iOS Runtime:**
   - Look for available iOS versions (e.g., iOS 17.5, iOS 18.0)
   - Click the **Download** button next to the iOS version you want
   - Wait for download to complete (this can take 10-30 minutes depending on your internet speed)

### Option 2: Download via Command Line

```bash
# List available runtimes
xcodebuild -downloadPlatform iOS

# Or use xcode-select to ensure Xcode is properly configured
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Option 3: Install via Xcode GUI

1. Open Xcode
2. Go to **Window → Devices and Simulators** (or press `Cmd + Shift + 2`)
3. Click the **"+"** button to add a simulator
4. If no runtimes are available, Xcode will prompt you to download one
5. Click **Download** when prompted

## Verify Installation

After downloading, verify the runtime is installed:

```bash
xcrun simctl list runtimes
```

You should see something like:
```
iOS 17.5 (17.5 - 21F79) - com.apple.CoreSimulator.SimRuntime.iOS-17-5
```

## Create iPad Simulator After Runtime is Installed

Once the runtime is installed, run:

```bash
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
./CREATE_IPAD_SIMULATOR.sh
```

Or manually:

```bash
# Get the runtime identifier
RUNTIME=$(xcrun simctl list runtimes | grep "iOS" | tail -1 | awk -F'[()]' '{print $2}' | xargs)

# Create iPad simulator
xcrun simctl create "TAV2 Mobile iPad" "iPad Pro (12.9-inch) (6th generation)" "$RUNTIME"

# Boot it
xcrun simctl boot "TAV2 Mobile iPad"

# Open Simulator
open -a Simulator
```

## Troubleshooting

### "xcode-select: error: tool 'xcodebuild' requires Xcode"

Make sure Xcode is fully installed and configured:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```

### "No runtimes available"

1. Make sure Xcode is fully installed (not just command line tools)
2. Open Xcode at least once to complete setup
3. Download iOS runtime via Xcode Settings → Platforms

### First Time Opening Xcode

If this is your first time opening Xcode:
1. It may ask you to install additional components
2. Accept and let it complete
3. Then go to Settings → Platforms to download iOS runtime
