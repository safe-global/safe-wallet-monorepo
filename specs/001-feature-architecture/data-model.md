# Data Model: Feature Architecture Standard

**Date**: 2026-01-08
**Feature**: 001-feature-architecture

## Overview

This document defines the standard structure for features in the Safe{Wallet} web application. A "feature" is a self-contained domain module with its own components, hooks, services, types, and optional Redux store.

---

## Feature Module Structure

### Directory Layout

```
apps/web/src/features/{feature-name}/
├── index.ts              # Public API (barrel file) - REQUIRED
├── types.ts              # TypeScript interfaces - REQUIRED
├── constants.ts          # Feature constants - REQUIRED
├── components/
│   ├── index.ts          # Component exports - REQUIRED
│   └── {ComponentName}/
│       ├── index.tsx     # Component implementation
│       ├── index.test.tsx
│       └── styles.module.css (optional)
├── hooks/
│   ├── index.ts          # Hook exports - REQUIRED
│   ├── useIs{FeatureName}Enabled.ts - REQUIRED
│   └── use{HookName}.ts
├── services/
│   ├── index.ts          # Service exports - REQUIRED if services exist
│   └── {ServiceName}.ts
└── store/                # Redux slice - OPTIONAL
    ├── index.ts          # Store exports
    └── {sliceName}Slice.ts
```

### File Purposes

| File                             | Purpose                                                         | Required          |
| -------------------------------- | --------------------------------------------------------------- | ----------------- |
| `index.ts`                       | Public API barrel - only exports meant for external consumption | Yes               |
| `types.ts`                       | All TypeScript interfaces, types, and enums for the feature     | Yes               |
| `constants.ts`                   | Feature-specific constants, magic strings, configuration        | Yes               |
| `components/index.ts`            | Re-exports public components                                    | Yes               |
| `hooks/index.ts`                 | Re-exports public hooks                                         | Yes               |
| `hooks/useIs{Feature}Enabled.ts` | Feature flag check hook                                         | Yes               |
| `services/index.ts`              | Re-exports public services                                      | If services exist |
| `store/index.ts`                 | Re-exports Redux slice and selectors                            | If store exists   |

---

## Feature Entity Definition

### Feature

A self-contained domain module.

**Attributes:**

| Attribute     | Type              | Description                                       |
| ------------- | ----------------- | ------------------------------------------------- |
| `name`        | `string`          | Kebab-case directory name (e.g., `walletconnect`) |
| `featureFlag` | `FEATURES`        | Enum value from `@safe-global/utils/utils/chains` |
| `publicAPI`   | `FeatureExports`  | Types, hooks, components exported from `index.ts` |
| `internalAPI` | `InternalExports` | Components, hooks, services NOT exported          |

### Feature Flag

A boolean configuration from CGW API.

**Attributes:**

| Attribute       | Type       | Description                                  |
| --------------- | ---------- | -------------------------------------------- |
| `key`           | `FEATURES` | Enum key (e.g., `NATIVE_WALLETCONNECT`)      |
| `value`         | `boolean`  | Whether feature is enabled for current chain |
| `chainSpecific` | `boolean`  | True - flags are per-chain                   |

### Feature Public API

What a feature exposes to the rest of the application.

**Allowed Exports:**

| Export Type       | Example                          | Notes                      |
| ----------------- | -------------------------------- | -------------------------- |
| Default component | `export default FeatureWidget`   | Lazy-loaded entry point    |
| Types             | `export type { FeatureConfig }`  | Always tree-shakeable      |
| Hooks             | `export { useIsFeatureEnabled }` | Feature flag hook required |
| Store selectors   | `export { selectFeatureState }`  | If feature has Redux state |
| Constants         | `export { FEATURE_CONSTANT }`    | If needed externally       |

**Forbidden Exports:**

- Internal components (anything in subdirectories)
- Internal hooks (except the enabled check)
- Service implementations
- Internal utilities

---

## State Transitions

### Feature Lifecycle

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   LOADING   │────►│   DISABLED   │     │   ENABLED   │
│ (undefined) │     │   (false)    │     │   (true)    │
└─────────────┘     └──────────────┘     └─────────────┘
       │                                        ▲
       └────────────────────────────────────────┘
```

| State    | `useIsFeatureEnabled()` | Behavior                             |
| -------- | ----------------------- | ------------------------------------ |
| Loading  | `undefined`             | Render nothing (no flash)            |
| Disabled | `false`                 | Render nothing (no side effects)     |
| Enabled  | `true`                  | Render feature, execute side effects |

---

## Validation Rules

### Import Rules (ESLint Enforced)

| Rule                 | Valid Import               | Invalid Import                                |
| -------------------- | -------------------------- | --------------------------------------------- |
| Feature from outside | `@/features/walletconnect` | `@/features/walletconnect/components/WcInput` |
| Feature internals    | Within same feature only   | Cross-feature internal imports                |
| Shared code          | `@/hooks/useChains`        | Feature exporting shared code                 |

### File Naming Conventions

| Type                | Convention                  | Example                                 |
| ------------------- | --------------------------- | --------------------------------------- |
| Feature directory   | kebab-case                  | `walletconnect`, `safe-shield`          |
| Component directory | PascalCase                  | `WcHeaderWidget`, `SafeShieldDisplay`   |
| Hook file           | camelCase with `use` prefix | `useWcUri.ts`, `useIsFeatureEnabled.ts` |
| Service file        | PascalCase                  | `WalletConnectWallet.ts`                |
| Type file           | Always `types.ts`           | `types.ts`                              |
| Constants file      | Always `constants.ts`       | `constants.ts`                          |

### Required Feature Flag Hook Pattern

```typescript
// hooks/useIs{FeatureName}Enabled.ts

import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIs{FeatureName}Enabled(): boolean | undefined {
  return useHasFeature(FEATURES.{FEATURE_FLAG})
}
```

---

## Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                        Feature                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  components/ │    │    hooks/    │    │   services/  │  │
│  │              │    │              │    │              │  │
│  │  index.ts ◄──┼────┼── index.ts ◄─┼────┼── index.ts   │  │
│  │  (exports)   │    │  (exports)   │    │  (exports)   │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    index.ts                          │   │
│  │              (Feature Public API)                    │   │
│  │  - default export: lazy-loaded component             │   │
│  │  - named exports: types, hooks, selectors            │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                               │
└────────────────────────────┼───────────────────────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │     External Consumers      │
              │  (pages, other features)    │
              │                             │
              │  import X from              │
              │  '@/features/walletconnect' │
              └─────────────────────────────┘
```

---

## Migration Assessment Fields

For tracking feature compliance during migration:

| Field                  | Type                          | Description                                    |
| ---------------------- | ----------------------------- | ---------------------------------------------- |
| `featureName`          | `string`                      | Directory name                                 |
| `hasRootIndex`         | `boolean`                     | Has `index.ts` at feature root                 |
| `hasTypes`             | `boolean`                     | Has `types.ts`                                 |
| `hasConstants`         | `boolean`                     | Has `constants.ts`                             |
| `hasComponentIndex`    | `boolean`                     | Has `components/index.ts`                      |
| `hasHooksIndex`        | `boolean`                     | Has `hooks/index.ts`                           |
| `hasEnabledHook`       | `boolean`                     | Has `useIs{Feature}Enabled.ts`                 |
| `hasServicesIndex`     | `boolean`                     | Has `services/index.ts` (if services exist)    |
| `hasStoreIndex`        | `boolean`                     | Has `store/index.ts` (if store exists)         |
| `internalImportsCount` | `number`                      | Count of external imports to feature internals |
| `complianceScore`      | `number`                      | 0-100% based on above fields                   |
| `migrationEffort`      | `'low' \| 'medium' \| 'high'` | Estimated effort                               |
