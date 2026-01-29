#!/bin/bash

# Quick script to view iOS Simulator logs

echo "📱 iOS Simulator Logs Viewer"
echo ""

# Check if simulator is running
BOOTED=$(xcrun simctl list devices | grep Booted | head -1)

if [ -z "$BOOTED" ]; then
    echo "⚠️  No simulator is currently running."
    echo "   Start a simulator first, then run this script again."
    exit 1
fi

echo "✅ Simulator detected: $BOOTED"
echo ""
echo "Choose an option:"
echo "1. Stream all simulator logs (real-time)"
echo "2. Stream TAV2Mobile app logs only"
echo "3. View crash logs"
echo "4. Open Xcode console"
echo "5. Open macOS Console app"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
  1)
    echo "📋 Streaming all simulator logs (Press Ctrl+C to stop)..."
    xcrun simctl spawn booted log stream --level=debug
    ;;
  2)
    echo "📋 Streaming TAV2Mobile app logs (Press Ctrl+C to stop)..."
    xcrun simctl spawn booted log stream --predicate 'processImagePath contains "TAV2Mobile"'
    ;;
  3)
    echo "📋 Opening crash logs directory..."
    open ~/Library/Logs/DiagnosticReports/
    ;;
  4)
    echo "📋 Opening Xcode..."
    open -a Xcode /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/ios/TAV2Mobile.xcworkspace
    echo "   Once Xcode opens, press Cmd+Shift+Y to view the console"
    ;;
  5)
    echo "📋 Opening Console app..."
    open -a Console
    echo "   Filter by 'Simulator' or 'TAV2Mobile' in the search box"
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac
