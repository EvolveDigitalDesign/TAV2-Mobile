# Component Migration Checklist

This document tracks the migration of components from the TAV2 web app to the TAV2-Mobile app.

## Status Legend
- ✅ Completed
- 🚧 In Progress
- ⏳ Pending
- ❌ Not Needed
- 📝 Needs Review

---

## Core UI Components

### Buttons
- [ ] `/TAV2/src/components/ui/button/Button.tsx` → Mobile Button component
- [ ] Button variants (primary, secondary, danger, etc.)
- [ ] Button sizes
- [ ] Loading states
- [ ] Disabled states
- [ ] Icon buttons

### Inputs
- [ ] Text input component
- [ ] Number input component
- [ ] Email input component
- [ ] Password input component
- [ ] Textarea component
- [ ] Input validation states
- [ ] Input error messages

### Form Components
- [ ] Date picker
- [ ] Time picker
- [ ] Dropdown/Select component
- [ ] Checkbox component
- [ ] Radio button component
- [ ] Switch/Toggle component
- [ ] File upload (camera/gallery)

### Display Components
- [ ] Card component
- [ ] Badge component
- [ ] Avatar component
- [ ] Alert/Notification component
- [ ] Loading spinner
- [ ] Empty state component
- [ ] Progress bar

### Navigation Components
- [ ] Tab bar component
- [ ] Header component
- [ ] Back button
- [ ] Menu/Drawer component

### Data Display
- [ ] List/FlatList component
- [ ] Table component (if needed)
- [ ] Chart components (if needed)
- [ ] Pagination component

---

## Common Components

### Page Meta
- [ ] `/TAV2/src/components/common/PageMeta.tsx` → Mobile equivalent
  - Note: Mobile doesn't need HTML meta tags, but may need screen titles

### Dashboard Header
- [ ] `/TAV2/src/components/common/DashboardHeader.tsx` → Mobile header
- [ ] Title display
- [ ] Action buttons
- [ ] Breadcrumbs (if needed)

### ScrollToTop
- [ ] `/TAV2/src/components/common/ScrollToTop.tsx` → Mobile scroll to top
  - Note: May not be needed in mobile, or use FloatingActionButton

---

## Dashboard Components

### Analytics Metrics
- [ ] `/TAV2/src/components/dashboard/AnalyticsMetrics.tsx` → Mobile metrics display
- [ ] KPI cards
- [ ] Metric comparison
- [ ] Trend indicators

### Role-Based Dashboard
- [ ] `/TAV2/src/components/dashboard/RoleBasedDashboard.tsx` → Mobile dashboard router
- [ ] Role detection
- [ ] Dashboard routing

### Placeholder Dashboard
- [ ] `/TAV2/src/components/dashboard/PlaceholderDashboard.tsx` → Mobile placeholder
  - Note: May not be needed

---

## Auth Components

### Sign In
- [ ] `/TAV2/src/pages/AuthPages/SignIn.tsx` → Mobile SignIn screen
- [ ] Email input
- [ ] Password input
- [ ] Login button
- [ ] Error handling
- [ ] Loading states
- [ ] M365 SSO button (if applicable)

### Sign Up
- [ ] `/TAV2/src/pages/AuthPages/SignUp.tsx` → Mobile SignUp screen
  - Note: May not be needed for mobile

### M365 Callback
- [ ] `/TAV2/src/pages/AuthPages/M365Callback.tsx` → Mobile callback handler
- [ ] Deep linking support
- [ ] Token handling

### Reset Password
- [ ] `/TAV2/src/pages/AuthPages/ResetPassword.tsx` → Mobile reset password
  - Note: May not be needed

### Two-Step Verification
- [ ] `/TAV2/src/pages/AuthPages/TwoStepVerification.tsx` → Mobile 2FA
  - Note: May not be needed

---

## Dashboard Screens

### Crew Supervisor Dashboard
- [ ] `/TAV2/src/pages/Dashboard/PA/CrewSupervisor/index.tsx` → Mobile dashboard
- [ ] KPI metrics display
- [ ] Subprojects list
- [ ] Revenue metrics
- [ ] NPT metrics
- [ ] Plugs metrics
- [ ] Unapproved tickets
- [ ] Navigation to detail screens

### Other Role Dashboards (Lower Priority)
- [ ] `/TAV2/src/pages/Dashboard/PA/Admin.tsx`
- [ ] `/TAV2/src/pages/Dashboard/PA/DistrictManager.tsx`
- [ ] `/TAV2/src/pages/Dashboard/PA/FinanceAdmin.tsx`
- [ ] `/TAV2/src/pages/Dashboard/PA/OperationsAdmin.tsx`
- [ ] `/TAV2/src/pages/Dashboard/PA/SafetyAdmin.tsx`
- [ ] `/TAV2/src/pages/Dashboard/PA/Driver.tsx`
- [ ] `/TAV2/src/pages/Dashboard/PA/MaintenanceAdmin.tsx`
- [ ] `/TAV2/src/pages/Dashboard/PA/MaintenancePerson.tsx`
- [ ] `/TAV2/src/pages/Dashboard/PA/Superintendent/index.tsx`
- [ ] `/TAV2/src/pages/Dashboard/PA/Engineering.tsx`

---

## Project & Subproject Screens

### Projects List
- [ ] `/TAV2/src/pages/PA-Pages/Projects/index.tsx` → Mobile projects list
- [ ] Project cards/list
- [ ] Search/filter
- [ ] Navigation to project detail

### Subprojects List
- [ ] `/TAV2/src/pages/PA-Pages/Projects/subprojects.tsx` → Mobile subprojects list
- [ ] Subproject cards/list
- [ ] Filter by status
- [ ] Navigation to subproject detail

### Project Info
- [ ] `/TAV2/src/pages/PA-Pages/Projects/info.tsx` → Mobile project detail
- [ ] Project details display
- [ ] Related data
- [ ] Actions

### Subproject Info
- [ ] `/TAV2/src/pages/PA-Pages/Projects/subproject-info.tsx` → Mobile subproject detail
- [ ] Subproject details
- [ ] Related records
- [ ] Actions

### New Project
- [ ] `/TAV2/src/pages/PA-Pages/Projects/new.tsx` → Mobile new project form
  - Note: May not be needed for Crew Supervisor role

---

## Daily Work Records (DWR) - HIGH PRIORITY

### DWR List
- [ ] `/TAV2/src/pages/PA-Pages/Projects/daily-records.tsx` → Mobile DWR list
- [ ] DWR cards/list
- [ ] Status filters
- [ ] Search
- [ ] Pull to refresh
- [ ] Navigation to DWR form/detail

### DWR Form
- [ ] `/TAV2/src/pages/PA-Pages/Projects/DailyRecords.tsx` → Mobile DWR form
- [ ] Basic DWR fields (date, notes, contact)
- [ ] Work assignments section
- [ ] Time records section
- [ ] Equipment assignments section
- [ ] Charges section (inventory, service, miscellaneous)
- [ ] Photo attachments
- [ ] Save/submit functionality
- [ ] Offline editing support
- [ ] Validation

### All DWRs
- [ ] `/TAV2/src/pages/PA-Pages/Projects/all-dwrs.tsx` → Mobile all DWRs view
  - Note: May be combined with daily-records

### DWR Detail View
- [ ] Create mobile DWR detail screen
- [ ] Display all DWR information
- [ ] Edit capability
- [ ] Approval workflow (if applicable)

---

## Work Assignment Components

### Work Assignment Form
- [ ] Port work assignment form components
- [ ] Work description selection
- [ ] Time inputs (from/to)
- [ ] Description text input
- [ ] Template variable inputs

### Work Assignment List
- [ ] Display work assignments in DWR
- [ ] Edit/delete actions
- [ ] Reorder capability (if applicable)

---

## Equipment Components

### Equipment List
- [ ] `/TAV2/src/pages/PA-Pages/Company/Data/equipment.tsx` → Mobile equipment list
  - Note: May be simplified for mobile

### Equipment Usage Update
- [ ] `/TAV2/src/pages/PA-Pages/Company/Data/equipment-usage-update.tsx` → Mobile equipment usage
- [ ] Usage input
- [ ] Save functionality

### Equipment Assignment (in DWR)
- [ ] Equipment selection
- [ ] Usage tracking
- [ ] Assignment management

---

## Time Records Components

### Time Record List
- [ ] `/TAV2/src/pages/PA-Pages/Workorders/TimeRecord/index.tsx` → Mobile time records
  - Note: May be integrated into DWR form

### Time Record Form
- [ ] Employee selection
- [ ] Time inputs
- [ ] Date selection
- [ ] Save functionality

---

## Offline Mode Components (NEW)

### Offline Mode Toggle
- [ ] Create offline mode toggle component
- [ ] Status indicator
- [ ] Checkout status display

### Sync Status Indicator
- [ ] Network status indicator
- [ ] Sync progress
- [ ] Pending operations count
- [ ] Last sync time

### Conflict Resolution UI
- [ ] Conflict detection display
- [ ] Conflict resolution options
- [ ] Manual resolution interface

### Checkout Status
- [ ] Checked out records count
- [ ] Checkout expiration warning
- [ ] Checkout details

---

## Context Providers

### Auth Context
- [ ] `/TAV2/src/context/AuthContext.tsx` → Mobile auth store/context
- [ ] Login/logout
- [ ] Token management
- [ ] User state

### Role Context
- [ ] `/TAV2/src/context/RoleContext.tsx` → Mobile role store/context
- [ ] Role detection
- [ ] Permission checking

### Project Context
- [ ] `/TAV2/src/context/ProjectContext.tsx` → Mobile project store/context
- [ ] Current project state
- [ ] Project selection

### Subproject Context
- [ ] `/TAV2/src/context/SubprojectContext.tsx` → Mobile subproject store/context
- [ ] Current subproject state
- [ ] Subproject selection

### Other Contexts (Lower Priority)
- [ ] EquipmentContext
- [ ] RegionContext
- [ ] EmployeeContext
- [ ] ItemsContext
- [ ] SpreadsContext
- [ ] RigContext
- [ ] CustomerContext
- [ ] SubscriptionContext

---

## Utility Functions

### API Utilities
- [ ] `/TAV2/src/utils/apiUtils.ts` → Mobile API utilities
- [ ] Auth headers
- [ ] Error handling
- [ ] Request interceptors

### API Services
- [ ] `/TAV2/src/utils/workRecordsApi.ts` → Mobile work records service
- [ ] `/TAV2/src/utils/subprojectApi.ts` → Mobile subproject service
- [ ] `/TAV2/src/utils/employeeApi.ts` → Mobile employee service
- [ ] `/TAV2/src/utils/rigApi.ts` → Mobile rig service
- [ ] `/TAV2/src/utils/equipmentApi.ts` → Mobile equipment service
- [ ] `/TAV2/src/utils/analyticsApi.ts` → Mobile analytics service
- [ ] `/TAV2/src/utils/revenueApi.ts` → Mobile revenue service
- [ ] `/TAV2/src/utils/nptApi.ts` → Mobile NPT service
- [ ] `/TAV2/src/utils/plugsApi.ts` → Mobile plugs service
- [ ] All other API utility files

### Other Utilities
- [ ] Date/time utilities
- [ ] Formatting utilities
- [ ] Validation utilities
- [ ] Type utilities

---

## Routing Components

### Protected Route
- [ ] `/TAV2/src/components/routing/ProtectedRoute.tsx` → Mobile navigation guard
- [ ] Auth check
- [ ] Permission check
- [ ] Redirect handling

### Layout Selector
- [ ] `/TAV2/src/layout/LayoutSelector.tsx` → Mobile layout system
  - Note: Mobile may not need multiple layouts

---

## Additional Features (Lower Priority)

### Calendar
- [ ] `/TAV2/src/pages/PA-Pages/Calandar.tsx` → Mobile calendar
  - Note: May use native calendar component

### Reports
- [ ] `/TAV2/src/pages/PA-Pages/Reports/WellScheduling.tsx` → Mobile reports
  - Note: Lower priority

### Remittance
- [ ] `/TAV2/src/pages/PA-Pages/Remittance.tsx` → Mobile remittance
  - Note: Lower priority

### OneCall Tickets
- [ ] `/TAV2/src/pages/PA-Pages/Projects/OneCall/index.tsx` → Mobile OneCall
  - Note: Lower priority

### User Profile
- [ ] `/TAV2/src/pages/UserProfiles.tsx` → Mobile profile
- [ ] User info display
- [ ] Settings
- [ ] Password change

### Notifications
- [ ] `/TAV2/src/context/NotificationsContext.tsx` → Mobile notifications
- [ ] Notification display
- [ ] Notification management

---

## Notes

### Components That May Not Be Needed
- Some demo/example pages from TailAdmin template
- Complex chart visualizations (may simplify)
- Some admin-only features for Crew Supervisor role

### Components That Need Mobile-Specific Adaptation
- Tables → Lists/FlatLists
- Complex forms → Multi-step forms or modals
- Desktop layouts → Mobile-optimized layouts
- Hover states → Touch interactions
- Keyboard shortcuts → Touch gestures

### New Components Needed for Mobile
- Offline mode components
- Sync status components
- Conflict resolution UI
- Mobile-specific navigation
- Touch-optimized interactions

---

## Migration Priority

### Phase 1 (Critical)
1. Core UI components (buttons, inputs, cards)
2. Authentication screens
3. Crew Supervisor dashboard
4. DWR list and form
5. Offline mode components

### Phase 2 (High Priority)
1. Work assignments
2. Equipment management
3. Time records
4. Projects/subprojects navigation

### Phase 3 (Medium Priority)
1. Additional role dashboards
2. Reports
3. Calendar
4. User profile

### Phase 4 (Low Priority)
1. Admin features
2. Advanced analytics
3. Third-party integrations

---

## Progress Tracking

**Last Updated**: [Date]
**Total Components**: [Count]
**Completed**: [Count]
**In Progress**: [Count]
**Pending**: [Count]

---

*Update this checklist as components are migrated.*
