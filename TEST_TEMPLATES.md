# Test Templates for TAV2 Mobile App

This document provides test templates and examples for each type of component/service in the mobile app.

## Test Setup

### Jest Configuration
```json
{
  "preset": "react-native",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  "testMatch": [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx"
  ],
  "collectCoverageFrom": [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{ts,tsx}"
  ]
}
```

### Test Utilities
Create `src/utils/testUtils.tsx`:
```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthProvider } from '../context/AuthContext';

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
};

export const createMockAsyncStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] || null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
      return Promise.resolve();
    }),
  };
};
```

---

## Component Test Template

### Button Component Test
```typescript
// __tests__/components/ui/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../src/components/ui/Button';

describe('Button', () => {
  it('renders with text', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress}>Click me</Button>);
    
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    const { getByTestId } = render(<Button loading>Click me</Button>);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button disabled onPress={onPress}>Click me</Button>);
    
    fireEvent.press(getByText('Click me'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

---

## Service Test Template

### API Service Test
```typescript
// __tests__/services/api/client.test.ts
import axios from 'axios';
import apiClient, { getCachedData, setCachedData } from '../../src/services/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('axios');

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds auth token to requests', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test-token');
    (axios.create as jest.Mock).mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    });

    // Test implementation
  });

  it('handles 401 errors', async () => {
    // Test error handling
  });
});

describe('Cache Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores data in cache', async () => {
    const data = { id: 1, name: 'Test' };
    await setCachedData('test-key', data);
    
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'cache:test-key',
      expect.stringContaining(JSON.stringify(data))
    );
  });

  it('retrieves cached data', async () => {
    const data = { id: 1, name: 'Test' };
    const cached = {
      data,
      timestamp: Date.now(),
    };
    
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cached));
    
    const result = await getCachedData('test-key');
    expect(result).toEqual(data);
  });

  it('returns null for expired cache', async () => {
    const cached = {
      data: { id: 1 },
      timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
    };
    
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cached));
    
    const result = await getCachedData('test-key');
    expect(result).toBeNull();
  });
});
```

---

## Context Test Template

### Auth Context Test
```typescript
// __tests__/context/AuthContext.test.tsx
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../src/services/api/client';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../src/services/api/client');

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides auth state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('logs in successfully', async () => {
    const mockResponse = {
      data: {
        access: 'access-token',
        refresh: 'refresh-token',
        user: { id: 1, email: 'test@example.com' },
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.data.user);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('access_token', 'access-token');
  });

  it('logs out successfully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token');
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify({ id: 1 }));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

---

## Integration Test Template

### Checkout Service Integration Test
```typescript
// __tests__/services/offline/CheckoutService.integration.test.ts
import CheckoutService from '../../src/services/offline/CheckoutService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../src/services/api/client';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../src/services/api/client');

describe('CheckoutService Integration', () => {
  let checkoutService: CheckoutService;

  beforeEach(() => {
    checkoutService = new CheckoutService();
    jest.clearAllMocks();
  });

  it('completes full checkout flow', async () => {
    const mockCheckoutResponse = {
      data: {
        checkout_id: 'checkout-123',
        records: [
          {
            id: 1,
            type: 'daily_work_record',
            data: { id: 1, date: '2025-01-27', status: 'in_progress' },
          },
        ],
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockCheckoutResponse);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    const result = await checkoutService.checkoutRecords(123);

    expect(result.checkoutId).toBe('checkout-123');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'checkout:metadata',
      expect.stringContaining('checkout-123')
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'checkout:dwr:1',
      expect.stringContaining('in_progress')
    );
  });

  it('detects active checkout', async () => {
    const metadata = {
      checkout_id: 'checkout-123',
      is_active: true,
      expires_at: Date.now() + 24 * 60 * 60 * 1000,
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(metadata));

    const isCheckedOut = await checkoutService.isCheckedOut();

    expect(isCheckedOut).toBe(true);
  });
});
```

---

## Screen Test Template

### Sign In Screen Test
```typescript
// __tests__/screens/auth/SignInScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignInScreen from '../../src/screens/auth/SignInScreen';
import { AuthProvider } from '../../src/context/AuthContext';
import apiClient from '../../src/services/api/client';

jest.mock('../../src/services/api/client');

const renderSignIn = () => {
  return render(
    <AuthProvider>
      <SignInScreen />
    </AuthProvider>
  );
};

describe('SignInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email and password inputs', () => {
    const { getByPlaceholderText } = renderSignIn();
    
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('validates email format', async () => {
    const { getByPlaceholderText, getByText } = renderSignIn();
    
    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'invalid-email');
    
    const submitButton = getByText('Sign In');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Please enter a valid email')).toBeTruthy();
    });
  });

  it('calls login on successful form submission', async () => {
    const mockResponse = {
      data: {
        access: 'token',
        refresh: 'refresh-token',
        user: { id: 1 },
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const { getByPlaceholderText, getByText } = renderSignIn();
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/token/', {
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

---

## Offline Service Test Template

### Storage Service Test
```typescript
// __tests__/services/offline/StorageService.test.ts
import StorageService from '../../src/services/offline/StorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
    jest.clearAllMocks();
  });

  it('stores data correctly', async () => {
    const data = { id: 1, name: 'Test' };
    
    await storageService.setItem('test-key', data);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify(data)
    );
  });

  it('retrieves data correctly', async () => {
    const data = { id: 1, name: 'Test' };
    
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(data));

    const result = await storageService.getItem('test-key');

    expect(result).toEqual(data);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('test-key');
  });

  it('handles missing data', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const result = await storageService.getItem('missing-key');

    expect(result).toBeNull();
  });

  it('removes data correctly', async () => {
    await storageService.removeItem('test-key');

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
  });
});
```

---

## Test Coverage Goals

### Minimum Coverage Targets
- **Services**: 90%+
- **Utils**: 90%+
- **Components**: 80%+
- **Screens**: 70%+
- **Context**: 85%+

### Coverage Commands
```bash
# Run tests with coverage
npm test -- --coverage

# Generate coverage report
npm test -- --coverage --coverageReporters=html

# View coverage report
open coverage/index.html
```

---

## Mock Data Helpers

### Create Mock Data
```typescript
// __tests__/utils/mockData.ts
export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});

export const createMockDWR = (overrides = {}) => ({
  id: 1,
  date: '2025-01-27',
  ticket_number: '20250127001',
  status: 'in_progress',
  notes: 'Test notes',
  ...overrides,
});

export const createMockWorkAssignment = (overrides = {}) => ({
  id: 1,
  dwr_id: 1,
  description: 'Test work',
  from_time: '08:00',
  to_time: '17:00',
  ...overrides,
});
```

---

## Snapshot Testing

### Component Snapshot
```typescript
import renderer from 'react-test-renderer';
import Button from '../../src/components/ui/Button';

it('matches snapshot', () => {
  const tree = renderer.create(<Button>Click me</Button>).toJSON();
  expect(tree).toMatchSnapshot();
});
```

---

## E2E Test Template (Manual)

### Manual E2E Test Checklist
```markdown
## E2E Test: Sign In Flow

### Setup
- [ ] App installed on device/simulator
- [ ] Backend API running
- [ ] Test user credentials available

### Steps
1. [ ] Launch app
2. [ ] Verify Sign In screen displays
3. [ ] Enter email: test@example.com
4. [ ] Enter password: test123
5. [ ] Tap Sign In button
6. [ ] Verify loading indicator shows
7. [ ] Verify navigation to Dashboard
8. [ ] Verify user data displayed

### Expected Results
- ✅ Sign In succeeds
- ✅ Navigation works
- ✅ User data loads
- ✅ No errors in console
```

---

## Test Execution Workflow

### Before Each Task
1. Run existing tests: `npm test`
2. Verify no regressions
3. Check test coverage

### During Development
1. Write tests first (TDD) or alongside code
2. Run tests frequently: `npm test -- --watch`
3. Fix failing tests immediately

### After Each Task
1. Run all tests: `npm test`
2. Check coverage: `npm test -- --coverage`
3. Verify manual testing checklist
4. Mark task complete only if all tests pass

---

**Use these templates to ensure comprehensive test coverage throughout development.**
