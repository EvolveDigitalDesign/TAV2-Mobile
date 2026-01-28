# Quick Start Guide - TAV2 Mobile App Development

This guide provides step-by-step instructions to begin executing the migration plan.

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Xcode installed (for iOS development)
- [ ] Android Studio installed (for Android development)
- [ ] Access to the TAV2 web app codebase
- [ ] Access to the pnae-django backend
- [ ] Development environment configured

## Step 1: Initialize React Native Project

### Using React Native CLI (Recommended - No Service Dependencies)

```bash
cd /Users/alec_work/Documents/development/GitHub/TAV2-Mobile
npx react-native@latest init TAV2Mobile --template react-native-template-typescript
```

**Why React Native CLI:**
- No Expo service dependencies
- Full control over native modules
- No service costs
- Direct access to all React Native features
- Better for production apps

**Note:** Expo is skipped to avoid service dependencies and potential costs

## Step 2: Install Core Dependencies

```bash
# Navigation (Required)
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# API Client (Already used in web app)
npm install axios

# Offline Storage (Built-in alternative, free)
npm install @react-native-async-storage/async-storage

# Network Monitoring (Free, community)
npm install @react-native-community/netinfo

# Date/Time (Consistent with web app, free)
npm install date-fns

# Date Picker (Free, community - optional, can use built-in)
npm install @react-native-community/datetimepicker

# Image Picker (Free, community - for photo capture)
npm install react-native-image-picker

# Utilities (Free)
npm install clsx

# Skip these to minimize dependencies:
# - State management libraries (use React Context API)
# - Data fetching libraries (use Axios + manual caching)
# - UI component libraries (build custom components)
# - Form libraries (use controlled components)
```

## Step 3: Set Up Testing Configuration

Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
};
```

Create `jest.setup.js`:
```javascript
import '@testing-library/jest-native/extend-expect';
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

Verify testing works:
```bash
npm test
```

## Step 4: Set Up Project Structure

Create the following directory structure:

```bash
mkdir -p src/{components,screens,navigation,services,store,hooks,utils,types,constants,theme,offline}
mkdir -p src/components/{ui,common,forms}
mkdir -p src/services/{api,auth,offline}
mkdir -p assets/{images,fonts}
mkdir -p __tests__/{unit,integration,e2e}
```

## Step 5: Configure Environment Variables

Create `.env` file:

```bash
VITE_API_URL=http://localhost:8000
VITE_TOKEN_KEY=access_token
VITE_REFRESH_TOKEN_KEY=refresh_token
VITE_USER_DATA_KEY=user_data
```

Create `src/config/env.ts`:

```typescript
export const API_URL = process.env.VITE_API_URL || 'http://localhost:8000';
export const TOKEN_KEY = process.env.VITE_TOKEN_KEY || 'access_token';
export const REFRESH_TOKEN_KEY = process.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token';
export const USER_DATA_KEY = process.env.VITE_USER_DATA_KEY || 'user_data';
```

## Step 6: Set Up API Service Layer (With Manual Caching)

Create `src/services/api/client.ts`:

```typescript
import axios from 'axios';
import { API_URL, TOKEN_KEY } from '../../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
    }
    return Promise.reject(error);
  }
);

// Simple cache helper (no React Query needed)
export const getCachedData = async (key: string) => {
  const cached = await AsyncStorage.getItem(`cache:${key}`);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    // Cache valid for 5 minutes
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }
  }
  return null;
};

export const setCachedData = async (key: string, data: any) => {
  await AsyncStorage.setItem(`cache:${key}`, JSON.stringify({
    data,
    timestamp: Date.now(),
  }));
};

export default apiClient;
```

## Step 7: Set Up Navigation

Create `src/navigation/AppNavigator.tsx`:

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import screens
import SignInScreen from '../screens/auth/SignInScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SignIn" component={SignInScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = false; // Get from auth store

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
```

## Step 8: Set Up State Management (React Context API)

Create `src/context/AuthContext.tsx` (using built-in React Context):

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY } from '../config/env';
import apiClient from '../services/api/client';

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load auth state on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
    const storedUser = await AsyncStorage.getItem(USER_DATA_KEY);
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/api/token/', { email, password });
    const { access, refresh, user: userData } = response.data;
    
    await AsyncStorage.setItem(TOKEN_KEY, access);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    
    setToken(access);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY]);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

## Step 9: Create First Screen

Create `src/screens/auth/SignInScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthStore();

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Sign In" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
});
```

## Step 10: Update App Entry Point

Update `App.tsx`:

```typescript
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}
```

## Step 11: Run the App and Verify

**Run tests first:**
```bash
npm test
```

**Then run the app:**

### iOS
```bash
npm run ios
# OR with Expo
npx expo start --ios
```

### Android
```bash
npm run android
# OR with Expo
npx expo start --android
```

## Next Steps

1. **Port Authentication**: Complete the authentication flow
2. **Set Up Offline Storage**: Configure WatermelonDB or MMKV
3. **Port Crew Supervisor Dashboard**: Start with the base role
4. **Implement Offline Mode**: Follow `OFFLINE_MODE_IMPLEMENTATION.md`
5. **Port Daily Records**: Core feature for offline mode

## Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/phase-1-setup`
2. **Implement Feature**: Follow the migration plan phases
3. **Test Locally**: Run on iOS and Android simulators
4. **Test on Device**: Test on physical iPad/Android tablet
5. **Commit Changes**: Follow conventional commits
6. **Create PR**: Submit for review

## Useful Commands

```bash
# Start development server
npm start

# Run iOS
npm run ios

# Run Android
npm run android

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check

# Build for production
npm run build
```

## Troubleshooting

### Common Issues

1. **Metro bundler cache issues**
   ```bash
   npm start -- --reset-cache
   ```

2. **iOS build issues**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android build issues**
   - Clean build: `cd android && ./gradlew clean && cd ..`

4. **TypeScript errors**
   - Check `tsconfig.json` configuration
   - Ensure all types are imported correctly

## Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Query](https://tanstack.com/query/latest)

---

**Ready to start?** Begin with Phase 1 of the `MIGRATION_PLAN.md`!
