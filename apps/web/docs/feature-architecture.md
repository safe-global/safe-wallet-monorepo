# Feature architecture

Each feature lives in its own folder in `src/features/`. The feature's `public/` folder is its only entry point: other code imports a feature's files from `public/` and nowhere else. Everything outside `public/` is private to the feature.

ESLint enforces this for every feature ([`config/eslint/feature-public-imports.mjs`](../../../config/eslint/feature-public-imports.mjs)).

## Folder layout

```
features/recovery/
├── public/
│   ├── components/
│   │   └── RecoveryList.tsx      gated, lazy component
│   ├── hooks/
│   │   └── useRecoveryQueue.ts   cheap hook
│   ├── store/
│   │   └── selectors.ts
│   ├── services/                 side effects: API calls, contracts, transactions
│   ├── utils/                    pure functions
│   └── types.ts
├── components/                   private
├── hooks/                        private
└── services/                     private
```

- Import the one file you need: `import RecoveryList from '@/features/recovery/public/components/RecoveryList'`.
- No `index.ts` anywhere under `public/`, and no re-exports in `src/features`. A re-export makes every importer depend on every re-exported file, which ties features into one import cycle and makes `jest --findRelatedTests` select most of the test suite.
- Inside a feature, use relative imports.
- `public/` uses the same folders as the private side: `components/`, `hooks/`, `store/`, `services/` and `utils/`. Only `types.ts`, `constants.ts` and `utils.ts` sit at its top level, as at the feature root. ESLint enforces this layout.
- To make something public, move its file into the matching folder in `public/`.

## Public components are gated and lazy

A public component is a gated wrapper around the private component:

```tsx
// features/recovery/public/components/RecoveryList.tsx
import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const RecoveryList = gatedDynamic(FEATURES.RECOVERY, () => import('../../components/RecoveryList'))

export default RecoveryList
```

`gatedDynamic` renders nothing while the chain has the flag off, so the component's chunk downloads only when it renders with the flag on. The consumer does not check the flag.

A public component that must render while the current chain has the flag off uses `dynamic` from `@/utils/dynamic` instead, with a one-line comment that gives the reason. Examples are in `features/multichain/public/components/`: those components check the flags of each target chain, or warn about the Safe itself.

A small component that other code renders inline or in a fixed slot, such as an icon (`features/safe-shield/public/components/SeverityIcon.tsx`), a list-row part (`features/myAccounts/public/components/AccountItemInfo.tsx`) or a sidebar banner, may live in `public/` without a lazy wrapper: a lazy one would flicker or leave an empty slot. Its consumer checks the flag. A context provider, such as `features/safe-shield/public/components/SafeShieldProvider.tsx`, is static for the same reason: a lazy provider would hold back the children it wraps.

## Public hooks are the exception

A hook cannot be lazy or gated: it runs in its caller on every chain. Across features, prefer a gated component. Make a hook public only for a cheap value that the caller needs as data, such as a boolean. A public hook must:

- pass its feature's flag to any expensive work, for example `skip: !isEnabled`, so a hook that fetches always reads the flag;
- if it reads its feature's flag, return a neutral value (`false`, `[]`, `undefined`) when the flag is off and have a test that shows the neutral value with the flag off;
- load heavy libraries inside its async step (`await import(...)`), not at the top of the file.

A hook that reports a fact about the Safe or the store, such as `useIsCounterfactualSafe`, reads no flag: the fact stays true when the flag is off.

## Public functions and types

`public/` may also hold plain functions (selectors, transaction builders) and types. Keep the files light: what a public file imports at the top level loads for every importer.

## Where shared code goes

Ask whether the code still makes sense if the feature is deleted. If not, it belongs to that feature. If yes, it goes to `src/hooks`, `src/utils` or `src/components`. When two features need each other, the shared part belongs to neither: generic code goes to the global folders, and shared data goes to Redux.

## Adding a feature

1. Create `src/features/<feature>/` with a `public/` folder for what other code uses.
2. Add the feature's flag to `FEATURES` in `packages/utils/src/utils/chains.ts` and to the chain configs on the CGW API.
3. Give each public component a `gatedDynamic` wrapper, unless one of the exceptions above applies.
4. Add the flag-off tests for the public hooks that read a flag.
