# Analytics Abstraction Implementation Plan

## Overview
This document tracks the implementation of the new analytics abstraction layer for the Safe Wallet monorepo. The goal is to introduce a flexible analytics system while maintaining zero regression and enforcing strict security and privacy standards.

## Requirements

### Core Requirements
- ✅ Create pluggable analytics abstraction layer
- ✅ Implement React hook for easy component usage  
- ✅ Maintain backward compatibility with existing implementations
- ✅ Zero regression - all current functionality must work
- ✅ Pass all existing tests and add new comprehensive tests
- ✅ No linting issues

### Security & Privacy Requirements
- ✅ Enforce Mixpanel naming conventions (PascalCase event names, specific property formats)
- ✅ Only send currently tracked Mixpanel events to Mixpanel (whitelist approach)
- ✅ No GA events should be sent to Mixpanel unless explicitly whitelisted
- ✅ Implement PII scrubbing middleware
- ✅ Respect user consent preferences
- ✅ Secure localStorage queue implementation

### Technical Requirements
- ✅ Small, atomic commits when tests pass and linting is clean
- ✅ Comprehensive test coverage for new code
- ✅ Update architecture documentation as implementation progresses
- ✅ Provider-specific routing and filtering

## Implementation Steps

### Phase 1: Analysis and Planning
- [x] ~~Analyze current analytics architecture~~
- [x] ~~Identify current Mixpanel events for whitelisting~~ 
- [x] ~~Create comprehensive execution plan~~

### Phase 2: Core Infrastructure
- [ ] Create core analytics abstraction (`/apps/web/src/services/analytics/core/`)
  - [ ] Types and interfaces
  - [ ] Provider contracts
  - [ ] Middleware system
  - [ ] Analytics orchestrator
  - [ ] Builder pattern implementation

### Phase 3: Provider Adapters
- [ ] Google Analytics Provider
  - [ ] Wrap existing GTM implementation
  - [ ] Maintain SafeApp tracking functionality
  - [ ] Preserve consent management
- [ ] Mixpanel Provider  
  - [ ] Wrap existing Mixpanel implementation
  - [ ] Implement event whitelisting
  - [ ] Enforce naming conventions
  - [ ] Maintain feature flagging

### Phase 4: React Integration
- [ ] Create `useAnalytics` React hook
  - [ ] Integrate with existing consent management
  - [ ] Handle provider initialization
  - [ ] Provide type-safe event tracking

### Phase 5: Middleware & Security
- [ ] PII scrubbing middleware
- [ ] Mixpanel naming convention enforcement
- [ ] Event filtering/routing middleware
- [ ] Sampling middleware for high-traffic events

### Phase 6: Testing & Integration
- [ ] Unit tests for all providers
- [ ] Integration tests for middleware pipeline
- [ ] Mock providers for testing
- [ ] Update existing analytics service
- [ ] Ensure backward compatibility

### Phase 7: Documentation & Cleanup
- [ ] Update architecture documentation
- [ ] Add inline code documentation
- [ ] Final linting and test runs
- [ ] Performance validation

## Current Mixpanel Events Whitelist

Based on analysis of the codebase, these are the currently tracked Mixpanel events that should be whitelisted:

### User & Wallet Events
- `User signed in` - User authentication events
- `Wallet connected` - Wallet connection tracking
- `Wallet disconnected` - Wallet disconnection tracking

### Transaction Events  
- `Transaction created` - New transaction initiation
- `Transaction confirmed` - Transaction signature/confirmation
- `Transaction executed` - Successful transaction execution
- `Transaction failed` - Failed transaction tracking

### Safe Management Events
- `Safe created` - New Safe deployment
- `Safe activated` - Safe activation events
- `Safe opened` - Safe access tracking

### Feature Usage Events
- `Safe App opened` - Safe App usage tracking
- `Safe App interaction` - Safe App interaction events

**Security Note**: Only events currently being sent to Mixpanel will be included in the whitelist. GA-only events will be explicitly excluded from Mixpanel routing.

## Security Considerations

### Data Protection
- All PII (emails, full addresses) will be scrubbed via middleware
- Event payloads will be sanitized before transmission
- User consent will be checked before any tracking

### Access Control
- Mixpanel events are feature-flagged and require explicit consent
- Provider routing ensures events only go to intended destinations
- Offline queue respects consent settings

### Code Security
- No hardcoded tokens or secrets
- Secure error handling to prevent data leaks
- Input validation on all event parameters

## Commit Strategy

Small, atomic commits will be made at these checkpoints:
1. ✅ Core types and interfaces
2. ✅ Provider contracts implementation  
3. ✅ Google Analytics adapter
4. ✅ Mixpanel adapter with filtering
5. ✅ React hook implementation
6. ✅ Middleware pipeline
7. ✅ Test suite addition
8. ✅ Integration with existing service
9. ✅ Documentation updates

Each commit will only be made when:
- All tests pass
- No linting errors
- Application builds successfully
- Core functionality is verified

## Progress Tracking

- **Started**: 2025-01-11
- **Current Phase**: Phase 1 - Analysis and Planning ✅
- **Next Phase**: Phase 2 - Core Infrastructure
- **Estimated Completion**: TBD based on testing and validation

## Notes and Learnings

- Current implementation has tight coupling between providers
- Mixpanel initialization is feature-flagged via `FEATURES.MIXPANEL`
- GA implementation uses multiple measurement IDs for different event types
- Event structure differs significantly between GA and Mixpanel
- Consent management is handled at the store level via `cookiesAndTermsSlice`

---

*This document will be updated as the implementation progresses.*