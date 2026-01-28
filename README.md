# TAV2 Mobile App

Mobile application for TAV2, optimized for iPad use with offline functionality for field operations.

## Overview

This mobile app is a port of the TAV2 web application, designed primarily for Crew Supervisors working in the field. The key differentiator is the **offline mode** feature, which allows users to check out records, edit them locally, and sync changes when returning online.

## Project Structure

```
TAV2-Mobile/
├── MIGRATION_PLAN.md              # Comprehensive migration plan
├── OFFLINE_MODE_IMPLEMENTATION.md # Detailed offline mode specs
├── QUICK_START.md                 # Quick start guide
├── COMPONENT_MIGRATION_CHECKLIST.md # Component tracking
└── README.md                      # This file
```

## Key Features

- ✅ **Offline Mode**: Check out records, edit offline, sync when online
- ✅ **Crew Supervisor Dashboard**: Optimized for field operations
- ✅ **Daily Work Records**: Full DWR creation and editing
- ✅ **Multi-tenant Support**: Shared backend with web app
- ✅ **Role-based Access**: Permission-based feature access
- ✅ **iPad Optimized**: Designed for tablet use

## Technology Stack (Cost-Optimized)

- **Framework**: React Native with TypeScript
- **State Management**: React Context API (built-in) - No external library
- **Navigation**: React Navigation (required, free)
- **Data Fetching**: Axios + Manual Caching (no React Query)
- **Offline Storage**: AsyncStorage (built-in, free)
- **UI Components**: Custom components from React Native primitives
- **Forms**: Controlled components (no form library)
- **Build Tool**: React Native CLI (no Expo services)

## Getting Started

### For Cursor AI Development (Recommended)
1. **Start Here**: Read `CURSOR_EXECUTION_GUIDE.md` for step-by-step Cursor-optimized tasks
2. **Test Templates**: Use `TEST_TEMPLATES.md` for test examples
3. **Follow Tasks**: Execute tasks in order with verification at each step

### General Development
1. **Read the Migration Plan**: Start with `MIGRATION_PLAN.md` for the complete overview
2. **Quick Start**: Follow `QUICK_START.md` to set up your development environment
3. **Offline Mode**: Review `OFFLINE_MODE_IMPLEMENTATION.md` for detailed specs
4. **Component Tracking**: Use `COMPONENT_MIGRATION_CHECKLIST.md` to track progress

## Development Phases

### Phase 1: Project Setup & Foundation (Weeks 1-2)
- Initialize React Native project
- Install dependencies
- Set up build tools
- Configure development environment

### Phase 2: Core Infrastructure (Weeks 3-4)
- API service layer
- State management
- Navigation setup
- Theme & styling

### Phase 3: Authentication (Weeks 5-6)
- Authentication service
- User context & permissions
- Multi-tenant support

### Phase 4: Offline Mode (Weeks 7-9) ⚠️ CRITICAL
- Offline storage setup
- Network monitoring
- Record checkout/checkin
- Data synchronization
- Conflict resolution

### Phase 5: Component Migration (Weeks 10-11)
- Core UI components
- Form components
- Data display components

### Phase 6: Feature Porting (Weeks 12-13)
- Crew Supervisor dashboard
- Daily Work Records
- Projects & subprojects
- Work assignments
- Equipment management

### Phase 7: Testing & Optimization (Weeks 14-15)
- Unit testing
- Integration testing
- E2E testing
- Performance optimization

### Phase 8: Deployment (Week 16)
- Build configuration
- App Store preparation
- CI/CD pipeline
- Distribution

## Key Documents

### CURSOR_EXECUTION_GUIDE.md ⭐ **Start Here**
Step-by-step execution guide optimized for Cursor AI:
- Cursor-optimized prompts for each task
- Verification checkpoints with test commands
- Acceptance criteria for each task
- Progress tracking templates
- Testing strategies at each phase

### TEST_TEMPLATES.md
Comprehensive test templates:
- Component test examples
- Service test examples
- Context test examples
- Integration test examples
- Mock data helpers
- Coverage goals

### MIGRATION_PLAN.md
Comprehensive 8-phase migration plan covering:
- Technology stack selection
- Architecture design
- Detailed implementation tasks
- Risk mitigation
- Success metrics
- Timeline estimates

### OFFLINE_MODE_IMPLEMENTATION.md
Technical specifications for offline mode:
- Architecture and components
- Backend API requirements
- Local database schema
- Implementation details
- Conflict resolution
- Testing strategy

### QUICK_START.md
Step-by-step guide to:
- Initialize the project
- Install dependencies
- Set up project structure
- Create first screen
- Run the app

### COMPONENT_MIGRATION_CHECKLIST.md
Tracking document for:
- Components to migrate
- Migration status
- Priority levels
- Notes and adaptations

## Backend Integration

The mobile app shares the backend with the web app:
- **Backend**: `pnae-django` (Django REST Framework)
- **Authentication**: JWT tokens
- **API**: RESTful endpoints
- **Multi-tenant**: Tenant-aware API calls

### Required Backend Changes

For offline mode, the following backend endpoints may need to be added:
- `POST /api/workrecords/checkout/` - Check out records
- `POST /api/workrecords/checkin/` - Check in records
- `GET /api/workrecords/checkout/{id}/conflicts/` - Check for conflicts

See `OFFLINE_MODE_IMPLEMENTATION.md` for detailed API specifications.

## Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/phase-X-description`
2. **Implement Feature**: Follow migration plan phases
3. **Test Locally**: Run on iOS and Android simulators
4. **Test on Device**: Test on physical iPad/Android tablet
5. **Update Checklist**: Mark components as completed
6. **Commit Changes**: Follow conventional commits
7. **Create PR**: Submit for review

## Testing Strategy

- **Unit Tests**: Services, utilities, hooks
- **Integration Tests**: API integration, offline mode flows
- **E2E Tests**: Critical user flows (Detox)
- **Device Testing**: Real devices, various screen sizes

## Performance Targets

- App loads in < 3 seconds
- Offline mode toggle works reliably
- Sync success rate > 95%
- Crash rate < 1%
- API response time < 2 seconds

## Security Considerations

- Encrypt local database
- Secure token storage (keychain/keystore)
- Validate all local data before sync
- Expire checkouts automatically
- Device binding for checkouts

## Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [WatermelonDB](https://nozbe.github.io/WatermelonDB/)
- [React Query](https://tanstack.com/query/latest)

## Contributing

1. Review the migration plan
2. Pick a phase or component to work on
3. Follow the implementation guide
4. Update the checklist
5. Submit PR for review

## Status

**Current Phase**: Planning Complete ✅

**Next Steps**:
1. Review and approve migration plan
2. Set up development environment
3. Begin Phase 1: Project Setup

## Support

For questions or issues:
- Review the relevant documentation
- Check the migration plan for guidance
- Refer to the offline mode implementation guide

---

**Last Updated**: 2025-01-27
**Version**: 1.0.0
