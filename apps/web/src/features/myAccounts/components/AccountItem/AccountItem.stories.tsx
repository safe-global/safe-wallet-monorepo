import type { Meta, StoryObj } from '@storybook/react'
import { Paper, Box } from '@mui/material'
import { AccountItem } from './index'
import { StoreDecorator } from '@/stories/storeDecorator'
import type { SafeItem } from '@/hooks/safes'

const MOCK_ADDRESS = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'
const MOCK_CHAIN_ID = '1'

const MOCK_SAFE_ITEM: SafeItem = {
  address: MOCK_ADDRESS,
  chainId: MOCK_CHAIN_ID,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: '',
}

const MOCK_PINNED_SAFE_ITEM: SafeItem = {
  ...MOCK_SAFE_ITEM,
  isPinned: true,
}

const MOCK_OWNERS = [
  { value: '0x1234567890123456789012345678901234567890' },
  { value: '0x0987654321098765432109876543210987654321' },
]

// Wrapper component to simplify stories
const AccountItemStory = (props: { children: React.ReactNode }) => props.children

const meta: Meta<typeof AccountItemStory> = {
  title: 'Features/MyAccounts/AccountItem',
  component: AccountItemStory,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <Paper sx={{ p: 2, maxWidth: 600 }}>
          <Story />
        </Paper>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Standard account item with all typical parts
 */
export const Default: Story = {
  render: () => (
    <AccountItem.Link href="/safe" trackingLabel="storybook">
      <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} threshold={2} owners={3} />
      <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} name="My Safe" />
      <AccountItem.ChainBadge chainId={MOCK_CHAIN_ID} />
      <AccountItem.Balance fiatTotal="12345.67" />
    </AccountItem.Link>
  ),
}

/**
 * Account item marked as the currently selected safe
 */
export const CurrentSafe: Story = {
  tags: ['!chromatic'],
  render: () => (
    <AccountItem.Link href="/safe" isCurrentSafe trackingLabel="storybook">
      <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} threshold={2} owners={3} />
      <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} name="Current Safe" />
      <AccountItem.ChainBadge chainId={MOCK_CHAIN_ID} />
      <AccountItem.Balance fiatTotal="50000.00" />
    </AccountItem.Link>
  ),
}

/**
 * Account item without a name (shows shortened address)
 */
export const WithoutName: Story = {
  tags: ['!chromatic'],
  render: () => (
    <AccountItem.Link href="/safe" trackingLabel="storybook">
      <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} threshold={1} owners={1} />
      <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} />
      <AccountItem.ChainBadge chainId={MOCK_CHAIN_ID} />
      <AccountItem.Balance fiatTotal="100.50" />
    </AccountItem.Link>
  ),
}

/**
 * Account item with balance loading
 */
export const LoadingBalance: Story = {
  tags: ['!chromatic'],
  render: () => (
    <AccountItem.Link href="/safe" trackingLabel="storybook">
      <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} threshold={2} owners={5} />
      <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} name="Loading Balance Safe" />
      <AccountItem.ChainBadge chainId={MOCK_CHAIN_ID} />
      <AccountItem.Balance isLoading />
    </AccountItem.Link>
  ),
}

/**
 * Account item with read-only chips
 */
export const WithReadOnlyChip: Story = {
  tags: ['!chromatic'],
  render: () => (
    <AccountItem.Link href="/safe" trackingLabel="storybook">
      <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} threshold={3} owners={5} />
      <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} name="Read-only Safe">
        <AccountItem.StatusChip isReadOnly />
      </AccountItem.Info>
      <AccountItem.ChainBadge chainId={MOCK_CHAIN_ID} />
      <AccountItem.Balance fiatTotal="999.99" />
    </AccountItem.Link>
  ),
}

/**
 * Account item for undeployed safe (not activating)
 */
export const UndeployedSafe: Story = {
  tags: ['!chromatic'],
  render: () => (
    <AccountItem.Link href="/safe" trackingLabel="storybook">
      <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} threshold={2} owners={3} />
      <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} name="New Safe">
        <AccountItem.StatusChip undeployedSafe isActivating={false} />
      </AccountItem.Info>
      <AccountItem.ChainBadge chainId={MOCK_CHAIN_ID} />
    </AccountItem.Link>
  ),
}

/**
 * Account item for activating safe
 */
export const ActivatingSafe: Story = {
  tags: ['!chromatic'],
  render: () => (
    <AccountItem.Link href="/safe" trackingLabel="storybook">
      <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} threshold={2} owners={3} />
      <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} name="Activating Safe">
        <AccountItem.StatusChip undeployedSafe isActivating />
      </AccountItem.Info>
      <AccountItem.ChainBadge chainId={MOCK_CHAIN_ID} />
    </AccountItem.Link>
  ),
}

/**
 * Account item with pin button and context menu
 */
export const WithActions: Story = {
  render: () => (
    <AccountItem.Link href="/safe" trackingLabel="storybook">
      <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} threshold={2} owners={3} />
      <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} name="Safe with Actions" />
      <AccountItem.ChainBadge chainId={MOCK_CHAIN_ID} />
      <AccountItem.Balance fiatTotal="5000.00" />
      <AccountItem.PinButton safeItem={MOCK_SAFE_ITEM} threshold={2} owners={MOCK_OWNERS} />
      <AccountItem.ContextMenu address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} name="Safe with Actions" />
    </AccountItem.Link>
  ),
}

/**
 * Account item that is pinned
 */
export const PinnedSafe: Story = {
  tags: ['!chromatic'],
  render: () => (
    <AccountItem.Link href="/safe" trackingLabel="storybook">
      <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} threshold={2} owners={3} />
      <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} name="Pinned Safe" />
      <AccountItem.ChainBadge chainId={MOCK_CHAIN_ID} />
      <AccountItem.Balance fiatTotal="25000.00" />
      <AccountItem.PinButton safeItem={MOCK_PINNED_SAFE_ITEM} threshold={2} owners={MOCK_OWNERS} />
    </AccountItem.Link>
  ),
}

/**
 * Account item with onClick handler instead of href (selection mode)
 */
export const SelectionMode: Story = {
  tags: ['!chromatic'],
  render: () => (
    <AccountItem.Button onClick={() => alert('Safe selected!')}>
      <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} threshold={2} owners={3} />
      <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} name="Selectable Safe" />
      <AccountItem.ChainBadge chainId={MOCK_CHAIN_ID} />
      <AccountItem.Balance fiatTotal="7500.00" />
      <AccountItem.Checkbox checked={false} />
    </AccountItem.Button>
  ),
}

/**
 * Account item on different chains
 */
export const DifferentChains: Story = {
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <AccountItem.Link href="/safe" trackingLabel="storybook">
        <AccountItem.Icon address={MOCK_ADDRESS} chainId="1" threshold={2} owners={3} />
        <AccountItem.Info address={MOCK_ADDRESS} chainId="1" name="Ethereum Safe" />
        <AccountItem.ChainBadge chainId="1" />
        <AccountItem.Balance fiatTotal="10000.00" />
      </AccountItem.Link>

      <AccountItem.Link href="/safe" trackingLabel="storybook">
        <AccountItem.Icon address={MOCK_ADDRESS} chainId="137" threshold={2} owners={3} />
        <AccountItem.Info address={MOCK_ADDRESS} chainId="137" name="Polygon Safe" />
        <AccountItem.ChainBadge chainId="137" />
        <AccountItem.Balance fiatTotal="5000.00" />
      </AccountItem.Link>

      <AccountItem.Link href="/safe" trackingLabel="storybook">
        <AccountItem.Icon address={MOCK_ADDRESS} chainId="10" threshold={2} owners={3} />
        <AccountItem.Info address={MOCK_ADDRESS} chainId="10" name="Optimism Safe" />
        <AccountItem.ChainBadge chainId="10" />
        <AccountItem.Balance fiatTotal="2500.00" />
      </AccountItem.Link>
    </Box>
  ),
}

/**
 * Multi-chain safe icon variant
 */
export const MultiChainIcon: Story = {
  tags: ['!chromatic'],
  render: () => (
    <AccountItem.Link href="/safe" trackingLabel="storybook">
      <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} threshold={2} owners={3} isMultiChainItem />
      <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} chainName="4 networks" />
      <AccountItem.Balance fiatTotal="100000.00" />
    </AccountItem.Link>
  ),
}

/**
 * Multi-chain badge showing multiple network logos with tooltip
 */
export const MultiChainBadge: Story = {
  tags: ['!chromatic'],
  render: () => {
    const mockSafes = [
      { address: MOCK_ADDRESS, chainId: '1', isReadOnly: false, isPinned: false, lastVisited: 0, name: '' },
      { address: MOCK_ADDRESS, chainId: '137', isReadOnly: false, isPinned: false, lastVisited: 0, name: '' },
      { address: MOCK_ADDRESS, chainId: '10', isReadOnly: false, isPinned: false, lastVisited: 0, name: '' },
    ]

    return (
      <AccountItem.Link href="/safe" trackingLabel="storybook">
        <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} threshold={2} owners={3} isMultiChainItem />
        <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} name="Multi-chain Safe" showPrefix={false} />
        <AccountItem.ChainBadge safes={mockSafes} />
        <AccountItem.Balance fiatTotal="100000.00" />
      </AccountItem.Link>
    )
  },
}

/**
 * Minimal account item with only icon and info
 */
export const Minimal: Story = {
  tags: ['!chromatic'],
  render: () => (
    <AccountItem.Link href="/safe" trackingLabel="storybook">
      <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} />
      <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} />
    </AccountItem.Link>
  ),
}

/**
 * Account item with grouped elements
 */
export const GroupedElements: Story = {
  tags: ['!chromatic'],
  render: () => (
    <AccountItem.Link href="/safe" trackingLabel="storybook">
      <AccountItem.Icon address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} threshold={2} owners={3} />
      <AccountItem.Info address={MOCK_ADDRESS} chainId={MOCK_CHAIN_ID} name="Grouped Safe" />
      <AccountItem.Group>
        <AccountItem.ChainBadge chainId={MOCK_CHAIN_ID} />
        <AccountItem.Balance fiatTotal="15000.00" />
      </AccountItem.Group>
    </AccountItem.Link>
  ),
}
