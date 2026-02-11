# SafeSelectorDropdown

A dropdown component for selecting Safe accounts with integrated chain selection, built using shadcn/ui components.

## Features

- **Safe Selection**: Dropdown to select from multiple Safe accounts
- **Chain Selector**: Nested dropdown to switch between blockchain networks
- **Visual Information**:
  - Safe name with identicon (avatar)
  - Truncated address
  - Total balance
  - Threshold/owners display (e.g., 3/5)
  - Chain logos with overlapping display
- **Fully Clickable**: Entire dropdown trigger is clickable
- **Responsive Layout**: Adapts to different screen sizes

## Usage

```tsx
import SafeSelectorDropdown from '@/features/spaces/components/SafeSelectorDropdown'

const safes = [
  {
    id: '1',
    name: 'Treasury',
    address: '0xA77D...98b6',
    threshold: 3,
    owners: 5,
    balance: '$39.95M',
    chains: [
      { id: 'eth', name: 'Ethereum', logo: '' },
      { id: 'gnosis', name: 'Gnosis Chain', logo: '' },
      { id: 'base', name: 'Base', logo: '' },
    ],
  },
  // ... more safes
]

function MyComponent() {
  const [selectedSafeId, setSelectedSafeId] = useState('1')

  return (
    <SafeSelectorDropdown
      safes={safes}
      selectedSafeId={selectedSafeId}
      onSafeChange={(safeId) => {
        setSelectedSafeId(safeId)
        // Navigate to Safe-level view
      }}
      onChainChange={(chainId) => {
        console.log('Chain changed:', chainId)
        // Handle chain context change
      }}
    />
  )
}
```

## Props

| Prop             | Type                         | Description                       |
| ---------------- | ---------------------------- | --------------------------------- |
| `safes`          | `SafeInfo[]`                 | Array of Safe accounts to display |
| `selectedSafeId` | `string?`                    | ID of the currently selected Safe |
| `onSafeChange`   | `(safeId: string) => void?`  | Callback when a Safe is selected  |
| `onChainChange`  | `(chainId: string) => void?` | Callback when a chain is selected |
| `className`      | `string?`                    | Additional CSS classes            |

## Types

```typescript
interface SafeInfo {
  id: string
  name: string
  address: string
  threshold: number
  owners: number
  balance: string
  chains: ChainInfo[]
}

interface ChainInfo {
  id: string
  name: string
  logo: string
}
```

## Implementation Notes

- Uses shadcn/ui `Select` component for the main Safe dropdown
- Uses shadcn/ui `DropdownMenu` for the chain selector
- Avatar initials are automatically generated from Safe names
- Chain logos are displayed with overlapping style (max 3 visible)
- The component is fully controlled - state management is handled by the parent
- Real Safe data should be passed via props (addresses, balances, chain information)

## Storybook

View the component in Storybook:

```bash
yarn workspace @safe-global/web storybook
```

Navigate to: **Features > Spaces > SafeSelectorDropdown**

Stories:

- `Default`: Initial closed state
- `DropdownOpen`: Demonstrates dropdown interaction
- `SingleSafe`: Single Safe account
- `MultipleSafes`: Multiple Safe accounts with selection
