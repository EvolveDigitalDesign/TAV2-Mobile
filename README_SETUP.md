# TAV2 Mobile - Setup Instructions

## Initial Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Install iOS Dependencies (macOS only):**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Run the App:**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## Development

- **Start Metro**: `npm start`
- **Run Tests**: `npm test`
- **Type Check**: `npm run type-check`
- **Lint**: `npm run lint`

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── navigation/     # Navigation configuration
├── services/       # API and business logic
├── context/        # React Context providers
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── types/          # TypeScript types
├── constants/      # App constants
├── theme/          # Theme configuration
└── offline/        # Offline mode logic
```

## Next Steps

Follow the CURSOR_EXECUTION_GUIDE.md for step-by-step development.
