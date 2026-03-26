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
import type { SafeItemData } from '@/features/spaces/components/SafeSelectorDropdown/types'

const items: SafeItemData[] = [
  {
    id: '1:0xA77D...98b6',
    name: 'My Safe',
    address: '0xA77D...98b6',
    threshold: 3,
    owners: 5,
    balance: '16780000',
    chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null }],
  },
]

;<SafeSelectorDropdown
  items={items}
  selectedItemId={selectedItemId}
  onItemSelect={(itemId) => {
    // Handle Safe selection
  }}
  onChainChange={(chainId) => {
    // Handle chain context change
  }}
/>
```

## Props

| Prop             | Type                         | Description                       |
| ---------------- | ---------------------------- | --------------------------------- |
| `items`          | `SafeItemData[]`             | Array of Safe items to display    |
| `selectedItemId` | `string?`                    | ID of the currently selected item |
| `onItemSelect`   | `(itemId: string) => void?`  | Callback when an item is selected |
| `onChainChange`  | `(chainId: string) => void?` | Callback when a chain is selected |

## Architecture

The component uses a layered architecture with pure presentational components:

```
SafeSelectorDropdown/
├── components/
│   ├── SafeInfoDisplay.tsx         # Avatar + name/address
│   ├── BalanceDisplay.tsx          # Balance + threshold badge
│   ├── ChainLogo.tsx               # Chain logo wrapper
│   ├── SafeItem.tsx                # Single safe item (atomic)
│   └── SafeDropdownContainer.tsx   # List container
├── index.tsx                        # Main orchestrator
├── types.ts                         # TypeScript interfaces
└── utils.ts                         # Helper functions
```

### Components

- **`SafeSelectorDropdown`**: Main orchestrator managing UI state (open/close, selection)
- **`SafeDropdownContainer`**: Renders list of items with filtering
- **`SafeItem`**: Atomic item component (avatar, name, chains, balance, threshold)
- **`SafeInfoDisplay`**: Reusable avatar + name/address display
- **`BalanceDisplay`**: Reusable balance + threshold badge
- **`ChainLogo`**: Reusable chain logo wrapper

All components are pure and stateless, accepting pre-formatted data via props.

## Storybook

```bash
yarn workspace @safe-global/web storybook
```

Navigate to: **Features > Spaces > SafeSelectorDropdown**
