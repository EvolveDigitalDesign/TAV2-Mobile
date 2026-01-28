# Run This Command

## Single Command to Fix Ruby and Setup iOS

Run this command in your terminal:

```bash
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile && ./QUICK_RUBY_FIX.sh
```

---

## What This Does

1. ✅ Installs Homebrew (if not installed)
2. ✅ Installs Ruby 3.x via Homebrew
3. ✅ Configures your PATH
4. ✅ Installs CocoaPods
5. ✅ Verifies everything is working

---

## After Running

After the script completes:

1. **Open a new terminal window** (or run `source ~/.zshrc`)

2. **Continue with iOS setup:**
   ```bash
   cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
   
   # Generate iOS project (if not done)
   cd /tmp && npx react-native@latest init TempProject --template react-native-template-typescript --skip-install && cp -r TempProject/ios /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/ && rm -rf TempProject && cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
   
   # Rename project if needed
   cd ios && if [ -d "TempProject.xcodeproj" ]; then mv TempProject.xcodeproj TAV2Mobile.xcodeproj && mv TempProject.xcworkspace TAV2Mobile.xcworkspace && sed -i '' 's/TempProject/TAV2Mobile/g' TAV2Mobile.xcodeproj/project.pbxproj; fi && cd ..
   
   # Install pods
   cd ios && pod install && cd ..
   
   # Run the app
   npm run ios
   ```

---

## Or Run Everything in One Go

If you want to do it all at once (after running the Ruby fix):

```bash
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile && source ~/.zshrc && (cd /tmp && npx react-native@latest init TempProject --template react-native-template-typescript --skip-install && cp -r TempProject/ios /Users/alec_work/Documents/development/GitHub/TAV2-Mobile/ && rm -rf TempProject) && cd ios && ([ -d "TempProject.xcodeproj" ] && mv TempProject.xcodeproj TAV2Mobile.xcodeproj && mv TempProject.xcworkspace TAV2Mobile.xcworkspace && sed -i '' 's/TempProject/TAV2Mobile/g' TAV2Mobile.xcodeproj/project.pbxproj || true) && pod install && cd .. && npm run ios
```
