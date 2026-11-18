# Feature architecture

Each feature lives in its own folder in `src/features/`. The feature's `public/` folder is its only entry point: other code imports a feature's files from `public/` and nowhere else. Everything outside `public/` is private to the feature.

ESLint enforces this for every feature ([`config/eslint/feature-public-imports.mjs`](../../../config/eslint/feature-public-imports.mjs)).

## Folder layout

```
features/recovery/
├── public/
│   ├── RecoveryList.tsx      gated, lazy component
│   ├── useRecoveryQueue.ts   cheap hook
│   ├── selectors.ts          plain functions
│   └── types.ts
├── components/               private
├── hooks/                    private
└── services/                 private
```

- Import the one file you need: `import RecoveryList from '@/features/recovery/public/RecoveryList'`.
- No `index.ts` anywhere under `public/`, and no re-exports in `src/features`. A re-export makes every importer depend on every re-exported file, which ties features into one import cycle and makes `jest --findRelatedTests` select most of the test suite.
- Inside a feature, use relative imports.
- To make something public, move its file into `public/`. A large feature may group files in folders inside `public/`, for example `public/hooks/`.

## Public components are gated and lazy

A public component is a gated wrapper around the private component:

```tsx
// features/recovery/public/RecoveryList.tsx
import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const RecoveryList = gatedDynamic(FEATURES.RECOVERY, () => import('../components/RecoveryList'))

export default RecoveryList
```

`gatedDynamic` renders nothing while the chain has the flag off, so the component's chunk downloads only when it renders with the flag on. The consumer does not check the flag.

A public component that must render while the current chain has the flag off uses `dynamic` from `@/utils/dynamic` instead, with a one-line comment that gives the reason. Examples are in `features/multichain/public/`: those components check the flags of each target chain, or warn about the Safe itself.

A small component that other code renders inline or in a fixed slot, such as an icon (`features/safe-shield/public/SeverityIcon.tsx`), a list-row part (`features/myAccounts/public/AccountItemInfo.tsx`) or a sidebar banner, may live in `public/` without a lazy wrapper: a lazy one would flicker or leave an empty slot. Its consumer checks the flag.

## Public hooks are the exception

A hook cannot be lazy or gated: it runs in its caller on every chain. Across features, prefer a gated component. Make a hook public only for a cheap value that the caller needs as data, such as a boolean. A public hook must:

- return a neutral value (`false`, `[]`, `undefined`) when its flag is off, and pass the flag to any expensive work, for example `skip: !isEnabled`;
- load heavy libraries inside its async step (`await import(...)`), not at the top of the file;
- have a test that shows its neutral value with the flag off. A hook that reads no flag, for example one that only reads the store, needs no such test.

## Public functions and types

`public/` may also hold plain functions (selectors, transaction builders) and types. Keep the files light: what a public file imports at the top level loads for every importer.

## Where shared code goes

Ask whether the code still makes sense if the feature is deleted. If not, it belongs to that feature. If yes, it goes to `src/hooks`, `src/utils` or `src/components`. When two features need each other, the shared part belongs to neither: generic code goes to the global folders, and shared data goes to Redux.

## Adding a feature

1. Create `src/features/<feature>/` with a `public/` folder for what other code uses.
2. Give each public component a `gatedDynamic` wrapper, unless one of the exceptions above applies.
3. Add the flag-off tests for the public hooks that read a flag.
