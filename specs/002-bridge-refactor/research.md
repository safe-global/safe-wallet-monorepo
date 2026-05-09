# Research: Bridge Feature Refactor

**Feature**: 002-bridge-refactor  
**Date**: 2026-01-15

## Overview

This refactoring follows the established feature architecture pattern from 001-feature-architecture. No significant research was required as the pattern is fully documented and demonstrated in the walletconnect reference implementation.

## Decisions

### 1. `useIsGeoblockedFeatureEnabled` Location

**Decision**: Keep in bridge feature, export from public API

**Rationale**: The hook is currently only used within the bridge feature. While the TODO comment suggests it should be reusable by swap/staking features, moving it to shared hooks is out of scope for this refactoring task.

**Alternatives considered**:

- Move to `src/hooks/useIsGeoblockedFeatureEnabled.ts` - Rejected because it would expand scope beyond the bridge refactoring and requires coordination with other feature refactorings
- Leave unexported - Rejected because the spec requires it to be accessible for other features to import

**Follow-up**: Consider creating a separate task to extract `useIsGeoblockedFeatureEnabled` to shared hooks after all feature migrations are complete.

### 2. `_getAppData` Function Visibility

**Decision**: Keep as internal (not exported from public API)

**Rationale**: The underscore prefix indicates it's an internal implementation detail. It's only imported by the colocated test file, which is acceptable within the feature boundary.

**Alternatives considered**:

- Export for testing - Rejected because it exposes implementation details and the test file is within the feature directory anyway

### 3. Types File Contents

**Decision**: Create minimal `types.ts` file

**Rationale**: The bridge feature has no complex type definitions. The file will exist for consistency with the standard pattern and can be expanded if needed in the future.

**Alternatives considered**:

- Skip `types.ts` entirely - Rejected because the standard requires it for all features

### 4. Services Directory

**Decision**: Do not create services directory

**Rationale**: The bridge feature has no service layer. The widget rendering logic is embedded in components. Creating an empty services directory would add noise.

**Alternatives considered**:

- Create empty services directory - Rejected because the standard says "REQUIRED if services exist", not unconditionally required

### 5. Store Directory

**Decision**: Do not create store directory

**Rationale**: The bridge feature has no Redux state. It relies entirely on chain config feature flags and the geoblocking context provider.

**Alternatives considered**:

- Create empty store directory - Rejected for same reason as services

## Reference Implementation Analysis

Examined `src/features/walletconnect/` to understand the established pattern:

| Aspect       | WalletConnect                                              | Bridge (Target)                                              |
| ------------ | ---------------------------------------------------------- | ------------------------------------------------------------ |
| index.ts     | Complex exports (types, hooks, store, services, constants) | Simple (hooks, constants, default component)                 |
| types.ts     | Multiple interfaces (WalletConnectContextType, etc.)       | Minimal (potentially empty)                                  |
| constants.ts | Many constants (methods, events, metadata, bridges)        | Two constants (BRIDGE_WIDGET_URL, LOCAL_STORAGE_CONSENT_KEY) |
| components/  | Multiple complex components                                | Two simple components                                        |
| hooks/       | Multiple hooks                                             | Two hooks                                                    |
| services/    | WalletConnectWallet class, utils, tracking                 | None needed                                                  |
| store/       | Redux slices and Zustand stores                            | None needed                                                  |

The bridge feature is significantly simpler than walletconnect, which validates the decision to skip services and store directories.

## External Dependencies

No external dependencies to research. All required patterns are internal to the codebase:

- Next.js `dynamic()` - Already in use in current implementation
- Feature flags via `useHasFeature` - Already in use
- Geoblocking via context provider - Already in use

## Risks

**Low Risk**: The refactoring is purely structural with no logic changes. All existing tests should pass without modification.

**Mitigation**: Run full test suite after each file change to catch any regressions immediately.
