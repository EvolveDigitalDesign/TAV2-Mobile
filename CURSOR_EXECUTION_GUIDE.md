# Cursor Execution Guide - TAV2 Mobile App

This guide is optimized for executing the migration plan with Cursor AI, providing step-by-step verification, test checkpoints, and clear acceptance criteria for each task.

## How to Use This Guide

1. **Execute tasks in order** - Each phase builds on the previous one
2. **Run verification tests** after each task
3. **Mark tasks complete** only after tests pass
4. **Use Cursor's agent mode** for complex multi-file changes
5. **Verify incrementally** - Don't move forward until current step works

## Verification Strategy

### Test Levels
- **Unit Tests**: Test individual functions/components
- **Integration Tests**: Test service interactions
- **Manual Tests**: Test on device/simulator
- **Smoke Tests**: Quick verification that app runs

### Test Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test.ts

# Type check
npm run type-check

# Lint
npm run lint

# Build check
npm run build
```

---

## Phase 1: Project Setup & Foundation

### Task 1.1: Initialize React Native Project

**Cursor Prompt:**
```
Initialize a React Native TypeScript project in the current directory using React Native CLI. 
Set up the project structure with src/ directory containing: components, screens, navigation, services, context, hooks, utils, types, constants, theme, offline.
```

**Verification Steps:**
1. [ ] Project initializes without errors
2. [ ] `package.json` exists with React Native dependencies
3. [ ] TypeScript configuration exists (`tsconfig.json`)
4. [ ] Directory structure created
5. [ ] App runs: `npm run ios` or `npm run android`

**Test Command:**
```bash
npm run ios  # Should launch simulator with default React Native app
```

**Acceptance Criteria:**
- ✅ App launches in simulator
- ✅ No build errors
- ✅ TypeScript compiles without errors

---

### Task 1.2: Install Minimal Dependencies

**Cursor Prompt:**
```
Install the minimal required dependencies for the TAV2 mobile app:
- React Navigation (native, native-stack, bottom-tabs)
- Axios for API calls
- AsyncStorage for offline storage
- NetInfo for network monitoring
- date-fns for date utilities
- clsx for className utilities
- datetimepicker and image-picker (optional)

Update package.json and verify all dependencies install correctly.
```

**Verification Steps:**
1. [ ] All dependencies install without errors
2. [ ] `package.json` updated with correct versions
3. [ ] `node_modules` contains all packages
4. [ ] No peer dependency warnings (or acceptable ones)

**Test Command:**
```bash
npm install
npm list --depth=0  # Verify all packages installed
```

**Acceptance Criteria:**
- ✅ All packages install successfully
- ✅ No critical dependency conflicts
- ✅ package.json has correct dependencies

---

### Task 1.3: Configure Build Tools

**Cursor Prompt:**
```
Configure the build tools for the React Native project:
1. Set up environment variables (.env file)
2. Configure TypeScript paths/aliases in tsconfig.json
3. Set up ESLint and Prettier (match web app config if possible)
4. Create npm scripts for: dev, build, test, lint, type-check

Verify configuration works by running type-check and lint commands.
```

**Verification Steps:**
1. [ ] `.env` file created with API_URL
2. [ ] `tsconfig.json` has path aliases configured
3. [ ] ESLint configuration exists
4. [ ] Prettier configuration exists
5. [ ] npm scripts work: `npm run type-check`, `npm run lint`

**Test Commands:**
```bash
npm run type-check  # Should pass with no errors
npm run lint        # Should pass or show only acceptable warnings
```

**Acceptance Criteria:**
- ✅ TypeScript compiles without errors
- ✅ Linting passes (or only acceptable warnings)
- ✅ All npm scripts execute successfully

---

### Task 1.4: Create Project Structure

**Cursor Prompt:**
```
Create the complete project directory structure:
- src/components/{ui,common,forms}
- src/screens/{auth,dashboard,projects,dwr}
- src/navigation/
- src/services/{api,auth,offline}
- src/context/
- src/hooks/
- src/utils/
- src/types/
- src/constants/
- src/theme/
- src/offline/
- assets/{images,fonts}
- __tests__/{unit,integration}

Create index.ts files in each directory for clean exports.
```

**Verification Steps:**
1. [ ] All directories created
2. [ ] Index files created in each directory
3. [ ] Structure matches plan

**Test Command:**
```bash
find src -type d | sort  # Verify directory structure
```

**Acceptance Criteria:**
- ✅ All directories exist
- ✅ Index files created
- ✅ Structure ready for code

---

## Phase 2: Core Infrastructure

### Task 2.1: Create API Client with Manual Caching

**Cursor Prompt:**
```
Create the API client service with manual caching:
1. Create src/services/api/client.ts with axios instance
2. Add request interceptor for auth tokens
3. Add response interceptor for error handling
4. Create cache helper functions (getCachedData, setCachedData) using AsyncStorage
5. Create src/config/env.ts for environment variables

Write unit tests for the API client and cache functions.
```

**Verification Steps:**
1. [ ] API client created with axios
2. [ ] Request interceptor adds auth token
3. [ ] Response interceptor handles errors
4. [ ] Cache helpers work with AsyncStorage
5. [ ] Unit tests pass

**Test Commands:**
```bash
npm test -- services/api/client.test.ts
npm test -- services/api/cache.test.ts
```

**Acceptance Criteria:**
- ✅ API client initializes correctly
- ✅ Auth token added to requests
- ✅ Cache functions store/retrieve data
- ✅ Unit tests pass (80%+ coverage)

---

### Task 2.2: Create Auth Context

**Cursor Prompt:**
```
Create the authentication context using React Context API:
1. Create src/context/AuthContext.tsx
2. Implement login, logout, token refresh
3. Use AsyncStorage for token persistence
4. Add loading and error states
5. Create useAuth hook

Write unit tests for AuthContext and integration test for login flow.
```

**Verification Steps:**
1. [ ] AuthContext created
2. [ ] Login function works
3. [ ] Logout clears tokens
4. [ ] Token persisted in AsyncStorage
5. [ ] useAuth hook works
6. [ ] Tests pass

**Test Commands:**
```bash
npm test -- context/AuthContext.test.tsx
npm test -- context/AuthContext.integration.test.tsx
```

**Acceptance Criteria:**
- ✅ AuthContext provides auth state
- ✅ Login stores tokens correctly
- ✅ Logout clears all auth data
- ✅ Tests pass with >80% coverage

---

### Task 2.3: Set Up Navigation

**Cursor Prompt:**
```
Set up React Navigation:
1. Create src/navigation/AppNavigator.tsx
2. Create AuthStack (SignIn screen)
3. Create MainTabs (Dashboard screen)
4. Add navigation types
5. Connect to AuthContext for protected routes

Create placeholder SignIn and Dashboard screens. Verify navigation works.
```

**Verification Steps:**
1. [ ] Navigation structure created
2. [ ] AuthStack navigates to SignIn
3. [ ] MainTabs navigates to Dashboard
4. [ ] Protected routes work
5. [ ] Navigation types defined

**Test Commands:**
```bash
npm run ios  # Manually test navigation
# Or create navigation tests
npm test -- navigation/AppNavigator.test.tsx
```

**Acceptance Criteria:**
- ✅ App navigates between screens
- ✅ Auth state controls navigation
- ✅ No navigation errors

---

### Task 2.4: Create Custom UI Components

**Cursor Prompt:**
```
Create custom UI components from React Native primitives:
1. Button component (TouchableOpacity + Text)
2. Input component (TextInput with styling)
3. Card component (View with shadow)
4. Badge component (View + Text)
5. Loading component (ActivityIndicator)
6. Create src/theme/colors.ts and src/theme/spacing.ts

Write unit tests for each component. Create Storybook or visual test setup if possible.
```

**Verification Steps:**
1. [ ] Button component works
2. [ ] Input component works
3. [ ] Card component works
4. [ ] Badge component works
5. [ ] Loading component works
6. [ ] Theme colors/spacing defined
7. [ ] Components render correctly

**Test Commands:**
```bash
npm test -- components/ui/Button.test.tsx
npm test -- components/ui/Input.test.tsx
# ... test each component
npm run ios  # Visual verification
```

**Acceptance Criteria:**
- ✅ All components render correctly
- ✅ Components accept props as expected
- ✅ Unit tests pass
- ✅ Visual appearance matches design

---

## Phase 3: Authentication

### Task 3.1: Implement Sign In Screen

**Cursor Prompt:**
```
Create the Sign In screen:
1. Create src/screens/auth/SignInScreen.tsx
2. Use custom Input and Button components
3. Integrate with AuthContext
4. Add form validation
5. Add error handling and loading states
6. Match styling from web app

Write integration test for sign in flow.
```

**Verification Steps:**
1. [ ] Sign In screen renders
2. [ ] Email and password inputs work
3. [ ] Form validation works
4. [ ] Login function called on submit
5. [ ] Error messages display
6. [ ] Loading state shows during login
7. [ ] Navigation to dashboard after login

**Test Commands:**
```bash
npm test -- screens/auth/SignInScreen.test.tsx
npm test -- screens/auth/SignInScreen.integration.test.tsx
npm run ios  # Manual test with real API
```

**Acceptance Criteria:**
- ✅ Screen renders correctly
- ✅ Form validation works
- ✅ Login succeeds with valid credentials
- ✅ Error handling works
- ✅ Navigation after login works

---

### Task 3.2: Implement Token Refresh

**Cursor Prompt:**
```
Implement token refresh mechanism:
1. Add token refresh logic to AuthContext
2. Create token refresh interceptor in API client
3. Handle token expiration
4. Auto-refresh before expiration
5. Handle refresh failures (logout)

Write tests for token refresh flow.
```

**Verification Steps:**
1. [ ] Token refresh works
2. [ ] Interceptor refreshes expired tokens
3. [ ] Auto-refresh before expiration
4. [ ] Logout on refresh failure
5. [ ] Tests pass

**Test Commands:**
```bash
npm test -- context/AuthContext.refresh.test.tsx
npm test -- services/api/client.refresh.test.ts
```

**Acceptance Criteria:**
- ✅ Tokens refresh automatically
- ✅ Expired tokens handled correctly
- ✅ Refresh failures handled gracefully
- ✅ Tests pass

---

## Phase 4: Offline Mode (Critical)

### Task 4.1: Create Offline Storage Service

**Cursor Prompt:**
```
Create offline storage service using AsyncStorage:
1. Create src/services/offline/StorageService.ts
2. Implement getItem, setItem, removeItem, getAllKeys
3. Add JSON serialization/deserialization
4. Create TypeScript interfaces for stored data
5. Add error handling

Write unit tests for storage service.
```

**Verification Steps:**
1. [ ] Storage service created
2. [ ] Can store and retrieve data
3. [ ] JSON serialization works
4. [ ] Error handling works
5. [ ] Tests pass

**Test Commands:**
```bash
npm test -- services/offline/StorageService.test.ts
```

**Acceptance Criteria:**
- ✅ Data stores correctly
- ✅ Data retrieves correctly
- ✅ JSON handling works
- ✅ Error cases handled
- ✅ Tests pass

---

### Task 4.2: Implement Checkout Service

**Cursor Prompt:**
```
Implement checkout service for offline mode:
1. Create src/services/offline/CheckoutService.ts
2. Implement checkoutRecords() - calls backend, stores locally
3. Implement isCheckedOut() - checks AsyncStorage
4. Store records with proper keys
5. Handle checkout errors

Write unit and integration tests.
```

**Verification Steps:**
1. [ ] Checkout service created
2. [ ] checkoutRecords() calls backend
3. [ ] Records stored in AsyncStorage
4. [ ] isCheckedOut() works correctly
5. [ ] Error handling works
6. [ ] Tests pass

**Test Commands:**
```bash
npm test -- services/offline/CheckoutService.test.ts
npm test -- services/offline/CheckoutService.integration.test.ts
```

**Acceptance Criteria:**
- ✅ Checkout calls backend correctly
- ✅ Records stored locally
- ✅ Checkout status tracked
- ✅ Tests pass

---

### Task 4.3: Implement Checkin Service

**Cursor Prompt:**
```
Implement checkin service:
1. Create src/services/offline/CheckinService.ts
2. Implement checkinRecords() - collects changes, syncs to backend
3. Implement collectLocalChanges() - finds modified records
4. Handle conflict detection
5. Clear local data after successful checkin

Write comprehensive tests including conflict scenarios.
```

**Verification Steps:**
1. [ ] Checkin service created
2. [ ] collectLocalChanges() finds modified records
3. [ ] checkinRecords() syncs to backend
4. [ ] Conflicts detected
5. [ ] Local data cleared after checkin
6. [ ] Tests pass

**Test Commands:**
```bash
npm test -- services/offline/CheckinService.test.ts
npm test -- services/offline/CheckinService.integration.test.ts
```

**Acceptance Criteria:**
- ✅ Changes collected correctly
- ✅ Sync to backend works
- ✅ Conflicts handled
- ✅ Local cleanup works
- ✅ Tests pass

---

### Task 4.4: Implement Sync Service

**Cursor Prompt:**
```
Implement sync service for pending operations:
1. Create src/services/offline/SyncService.ts
2. Implement syncPendingOperations() - processes sync queue
3. Implement queueOperation() - adds to sync queue
4. Handle retry logic for failed syncs
5. Update sync status

Write tests for sync queue management.
```

**Verification Steps:**
1. [ ] Sync service created
2. [ ] Operations queued correctly
3. [ ] Sync processes queue
4. [ ] Retry logic works
5. [ ] Status updates correctly
6. [ ] Tests pass

**Test Commands:**
```bash
npm test -- services/offline/SyncService.test.ts
```

**Acceptance Criteria:**
- ✅ Queue management works
- ✅ Sync processes correctly
- ✅ Retries work
- ✅ Status tracking works
- ✅ Tests pass

---

### Task 4.5: Create Offline Mode UI

**Cursor Prompt:**
```
Create offline mode UI components:
1. Create OfflineModeToggle component
2. Create SyncStatusIndicator component
3. Create ConflictResolutionModal component
4. Integrate with OfflineContext
5. Add to main navigation

Write component tests and manual UI tests.
```

**Verification Steps:**
1. [ ] Toggle component works
2. [ ] Status indicator shows correct state
3. [ ] Conflict modal displays
4. [ ] UI updates on state changes
5. [ ] Tests pass

**Test Commands:**
```bash
npm test -- components/offline/OfflineModeToggle.test.tsx
npm run ios  # Manual UI test
```

**Acceptance Criteria:**
- ✅ UI components render
- ✅ State updates correctly
- ✅ User interactions work
- ✅ Tests pass

---

## Phase 5: Feature Implementation

### Task 5.1: Crew Supervisor Dashboard

**Cursor Prompt:**
```
Create Crew Supervisor dashboard:
1. Create src/screens/dashboard/CrewSupervisorDashboard.tsx
2. Port KPI metrics from web app
3. Port subprojects list
4. Add offline mode indicators
5. Integrate with API services

Write integration tests for dashboard data loading.
```

**Verification Steps:**
1. [ ] Dashboard renders
2. [ ] KPI metrics display
3. [ ] Subprojects list displays
4. [ ] Data loads from API
5. [ ] Offline indicators show
6. [ ] Tests pass

**Test Commands:**
```bash
npm test -- screens/dashboard/CrewSupervisorDashboard.test.tsx
npm test -- screens/dashboard/CrewSupervisorDashboard.integration.test.tsx
npm run ios  # Manual test
```

**Acceptance Criteria:**
- ✅ Dashboard displays correctly
- ✅ Data loads successfully
- ✅ Metrics accurate
- ✅ Tests pass

---

### Task 5.2: Daily Work Records List

**Cursor Prompt:**
```
Create DWR list screen:
1. Create src/screens/dwr/DWRListScreen.tsx
2. Display DWRs in FlatList
3. Add pull-to-refresh
4. Add filters (status, date)
5. Navigate to DWR form
6. Show offline status

Write tests for list rendering and filtering.
```

**Verification Steps:**
1. [ ] List renders DWRs
2. [ ] Pull-to-refresh works
3. [ ] Filters work
4. [ ] Navigation to form works
5. [ ] Offline status shows
6. [ ] Tests pass

**Test Commands:**
```bash
npm test -- screens/dwr/DWRListScreen.test.tsx
npm run ios  # Manual test
```

**Acceptance Criteria:**
- ✅ List displays correctly
- ✅ Refresh works
- ✅ Filters work
- ✅ Navigation works
- ✅ Tests pass

---

### Task 5.3: Daily Work Records Form

**Cursor Prompt:**
```
Create DWR form screen:
1. Create src/screens/dwr/DWRFormScreen.tsx
2. Port form fields from web app
3. Add work assignments section
4. Add time records section
5. Add equipment section
6. Add charges section
7. Support offline editing
8. Add validation

Write comprehensive form tests.
```

**Verification Steps:**
1. [ ] Form renders all fields
2. [ ] Form validation works
3. [ ] Can add work assignments
4. [ ] Can add time records
5. [ ] Can add equipment
6. [ ] Can add charges
7. [ ] Saves locally when offline
8. [ ] Syncs when online
9. [ ] Tests pass

**Test Commands:**
```bash
npm test -- screens/dwr/DWRFormScreen.test.tsx
npm test -- screens/dwr/DWRFormScreen.integration.test.tsx
npm run ios  # Manual test
```

**Acceptance Criteria:**
- ✅ Form works correctly
- ✅ Validation works
- ✅ Offline saving works
- ✅ Online sync works
- ✅ Tests pass

---

## Testing Strategy

### Unit Tests
- Test each function/component in isolation
- Mock dependencies
- Aim for 80%+ coverage
- Run after each task

### Integration Tests
- Test service interactions
- Test API integration
- Test offline/online flows
- Run after each phase

### Manual Tests
- Test on iOS simulator
- Test on Android emulator
- Test on physical devices
- Test critical user flows

### Smoke Tests
- App launches
- Navigation works
- API calls succeed
- Offline mode works

## Progress Tracking

### Task Status
- ⏳ Not Started
- 🚧 In Progress
- ✅ Complete (tests passing)
- ❌ Blocked
- ⚠️ Needs Review

### Verification Checklist Template
```markdown
## Task: [Task Name]

### Implementation
- [ ] Code written
- [ ] Code reviewed
- [ ] Linting passes

### Testing
- [ ] Unit tests written
- [ ] Unit tests pass
- [ ] Integration tests written
- [ ] Integration tests pass
- [ ] Manual testing done

### Documentation
- [ ] Code commented
- [ ] README updated (if needed)

### Acceptance
- [ ] All criteria met
- [ ] Ready for next task
```

## Cursor-Specific Tips

### 1. Use Multi-File Edits
When creating related files, use Cursor's multi-file edit:
```
Create the AuthContext with login, logout, and token refresh. 
Also create the useAuth hook and AuthProvider component.
Include error handling and loading states.
```

### 2. Incremental Development
Break large tasks into smaller prompts:
```
First, create the API client with basic axios setup.
Then add request interceptors.
Then add response interceptors.
Finally add caching helpers.
```

### 3. Test-Driven Development
Write tests first, then implementation:
```
Write unit tests for a Button component that:
- Renders with text
- Handles onPress
- Shows loading state
- Supports disabled state

Then implement the component to pass these tests.
```

### 4. Verification Prompts
After each task, verify:
```
Run the tests for the AuthContext and show me the results.
If any tests fail, fix them.
```

### 5. Code Review Prompts
Before marking complete:
```
Review the CheckoutService implementation for:
- Error handling
- Type safety
- Code quality
- Test coverage

Suggest improvements if needed.
```

## Common Verification Commands

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Run all tests
npm test

# Run specific test
npm test -- path/to/test.ts

# Build iOS
npm run ios

# Build Android
npm run android

# Check test coverage
npm test -- --coverage
```

## Success Criteria

A task is complete when:
1. ✅ Code implemented
2. ✅ All tests pass
3. ✅ No linting errors
4. ✅ Type checking passes
5. ✅ Manual testing successful
6. ✅ Code reviewed
7. ✅ Documentation updated

---

**Use this guide to execute the migration plan step-by-step with Cursor, ensuring each task is verified before moving to the next.**
