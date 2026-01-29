# View iOS Simulator Logs

## Method 1: Xcode Console (Recommended for Development)

1. **Open Xcode**
   ```bash
   open -a Xcode
   ```

2. **Open Your Project**
   - File → Open
   - Navigate to: `/Users/alec_work/Documents/development/GitHub/TAV2-Mobile/ios/TAV2Mobile.xcworkspace`
   - Click Open

3. **View Console**
   - At the bottom of Xcode, click the **"Debug Area"** button (or press `Cmd + Shift + Y`)
   - The console will show all logs from the running app
   - Filter by typing in the search box

## Method 2: macOS Console App

1. **Open Console App**
   ```bash
   open -a Console
   ```

2. **Filter for Simulator**
   - In the search box, type: `Simulator` or `TAV2Mobile`
   - Select your device/simulator from the sidebar
   - Logs will appear in real-time

## Method 3: Command Line (xcrun simctl)

### View All Simulator Logs
```bash
# List all simulators
xcrun simctl list devices

# Get the UDID of your running simulator
xcrun simctl list devices | grep Booted

# Stream logs from a specific simulator
xcrun simctl spawn booted log stream --level=debug
```

### View App-Specific Logs
```bash
# Stream logs for your app
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "TAV2Mobile"'
```

### Save Logs to File
```bash
# Save logs to a file
xcrun simctl spawn booted log stream --level=debug > ~/Desktop/ios_logs.txt
```

## Method 4: React Native Metro Bundler Logs

The Metro bundler (JavaScript) logs appear in the terminal where you ran `npm start`:

```bash
# Start Metro bundler (if not already running)
npm start

# You'll see:
# - JavaScript console.log() output
# - React Native warnings and errors
# - Network requests
# - Bundle loading status
```

## Method 5: Device Logs via Xcode

1. **Open Xcode**
2. **Window → Devices and Simulators** (or `Cmd + Shift + 2`)
3. **Select your simulator** from the left sidebar
4. **Click "Open Console"** button at the bottom
5. View all device logs in real-time

## Method 6: React Native Debugger

If you have React Native Debugger installed:

```bash
# Install React Native Debugger (if not installed)
brew install --cask react-native-debugger

# Open it
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

Then in your app, shake the device/simulator and select "Debug" to see JavaScript logs.

## Quick Commands

### View Recent Crash Logs
```bash
# List crash logs
xcrun simctl diagnose

# View specific crash log
open ~/Library/Logs/DiagnosticReports/
```

### Clear Logs
```bash
# Clear simulator logs (requires simulator UDID)
xcrun simctl erase all
```

### Filter Logs by Process
```bash
# View logs for your app only
xcrun simctl spawn booted log stream --predicate 'process == "TAV2Mobile"'
```

## Common Log Locations

- **Simulator Logs**: `~/Library/Logs/CoreSimulator/`
- **Crash Reports**: `~/Library/Logs/DiagnosticReports/`
- **Xcode Console**: Visible in Xcode's debug area
- **Metro Bundler**: Terminal where `npm start` is running

## Tips

1. **For React Native Development**: Use Xcode console + Metro bundler terminal
2. **For Native iOS Issues**: Use Console app or `xcrun simctl`
3. **For Crashes**: Check `~/Library/Logs/DiagnosticReports/`
4. **For Performance**: Use Xcode's Instruments tool

## Quick Script to View Logs

Create a script to easily view logs:

```bash
#!/bin/bash
# view-ios-logs.sh

echo "📱 iOS Simulator Logs"
echo ""
echo "Choose an option:"
echo "1. Stream all simulator logs"
echo "2. Stream TAV2Mobile app logs"
echo "3. View Metro bundler logs (JavaScript)"
echo "4. Open Xcode console"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    xcrun simctl spawn booted log stream --level=debug
    ;;
  2)
    xcrun simctl spawn booted log stream --predicate 'processImagePath contains "TAV2Mobile"'
    ;;
  3)
    echo "Metro bundler logs are in the terminal where you ran 'npm start'"
    ;;
  4)
    open -a Xcode /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/ios/TAV2Mobile.xcworkspace
    ;;
  *)
    echo "Invalid choice"
    ;;
esac
```
