# SafeSelectorDropdown

A dropdown component for selecting Safe accounts with integrated chain selection, built using shadcn/ui components.

## Features

- **Safe Selection**: Dropdown to select from multiple Safe accounts
- **Chain Selector**: Nested dropdown to switch between blockchain networks
- **Visual Information**: Safe name, address, balance, threshold/owners (3/5), chain logos
- **Fully Clickable**: Entire dropdown trigger is clickable
- **Responsive Layout**: Adapts to different screen sizes

## Usage

```tsx
import SafeSelectorDropdown from '@/features/spaces/components/SafeSelectorDropdown'
;<SafeSelectorDropdown
  safes={safes}
  selectedSafeId={selectedSafeId}
  onSafeChange={(safeId) => {
    // Handle Safe selection and navigation
  }}
  onChainChange={(chainId) => {
    // Handle chain context change
  }}
/>
```

## Props

| Prop             | Type                         | Description                       |
| ---------------- | ---------------------------- | --------------------------------- |
| `safes`          | `SafeInfo[]`                 | Array of Safe accounts to display |
| `selectedSafeId` | `string?`                    | ID of the currently selected Safe |
| `onSafeChange`   | `(safeId: string) => void?`  | Callback when a Safe is selected  |
| `onChainChange`  | `(chainId: string) => void?` | Callback when a chain is selected |
| `className`      | `string?`                    | Additional CSS classes            |

## Architecture

The component is built with a clean separation of concerns:

```
SafeSelectorDropdown/
├── hooks/
│   ├── useSafeSelectorState.ts      # Main orchestration hook
│   ├── useSafeSelectorDisplay.ts    # Display data derivation
│   ├── useSafeSelectorNavigation.ts # Navigation handlers
│   └── useSafeItemTransform.ts      # Safe data transformation
├── index.tsx                         # Main component
├── types.ts                          # TypeScript interfaces
└── utils.ts                          # Helper functions
```

### Hooks

- **`useSafeSelectorState`**: Main hook that orchestrates state, composes other hooks
- **`useSafeSelectorDisplay`**: Derives display info (name, address, threshold) from state
- **`useSafeSelectorNavigation`**: Handles routing for Safe/chain changes
- **`useSafeItemTransform`**: Transforms SafeInfo to display format with live balance

Each hook follows single-responsibility principle and uses existing app hooks (`useSafeInfo`, `useAddressBook`, `useChains`, `useBalances`).

## Storybook

```bash
yarn workspace @safe-global/web storybook
```

Navigate to: **Features > Spaces > SafeSelectorDropdown**
