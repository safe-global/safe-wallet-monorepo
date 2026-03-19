import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { fn } from 'storybook/test'
import { useState } from 'react'

const action = (name: string) => fn().mockName(name)
import SafeSelectorDropdown from './index'
import type { SafeItemData } from './types'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  layout: 'none',
  shadcn: true,
  store: {
    safeInfo: {
      data: { chainId: '1' },
    },
  },
})

const meta = {
  title: 'Features/Spaces/SafeSelectorDropdown',
  component: SafeSelectorDropdown,
  parameters: {
    layout: 'centered',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
  tags: ['autodocs'],
  argTypes: {
    items: { control: 'object' },
    selectedItemId: { control: 'text' },
    onItemSelect: { action: 'Item selected' },
  },
} satisfies Meta<typeof SafeSelectorDropdown>

export default meta
type Story = StoryObj<typeof meta>

const baseChains = [
  { chainId: '1', chainName: 'Ethereum', chainLogoUri: undefined, shortName: 'eth' },
  { chainId: '100', chainName: 'Gnosis Chain', chainLogoUri: undefined, shortName: 'gno' },
  { chainId: '8453', chainName: 'Base', chainLogoUri: undefined, shortName: 'base' },
]

const SAFE_NAMES = [
  'Treasury',
  'DAO Multisig',
  'Team Operations',
  'Grants Committee',
  'Marketing Wallet',
  'Legal Reserve',
  'Payroll Safe',
]

const createMockAddress = (index: number) => `0x${index.toString(16).padStart(40, '0')}` as `0x${string}`

const createMockSafeItem = (index: number, overrides = {}): SafeItemData => ({
  id: `${baseChains[index % baseChains.length].chainId}:${createMockAddress(index + 1)}`,
  name: SAFE_NAMES[index % SAFE_NAMES.length],
  address: createMockAddress(index + 1),
  threshold: 2 + (index % 2),
  owners: 3 + (index % 4),
  balance: String((1 + (index % 50)) * 1_000_000),
  chains: baseChains,
  ...overrides,
})

const mockItems: SafeItemData[] = [
  createMockSafeItem(0, {
    id: '1:0xa77de01c5b6f829cbe4604cf71ddc8c4d608b000',
    name: 'My Safe',
    address: '0xa77de01c5b6f829cbe4604cf71ddc8c4d608b000',
    threshold: 3,
    owners: 5,
    balance: '16780000',
  }),
  createMockSafeItem(1, {
    id: '100:0x86753fe4b8e29ce8a38cdf9559d80e05b00cdba0',
    name: 'Another Safe',
    address: '0x86753fe4b8e29ce8a38cdf9559d80e05b00cdba0',
    threshold: 3,
    owners: 5,
    balance: '40070000',
  }),
  createMockSafeItem(2, {
    id: '8453:0x86753fe4b8e29ce8a38cdf9559d80e05b0abcdef',
    name: 'One more Safe',
    address: '0x86753fe4b8e29ce8a38cdf9559d80e05b0abcdef',
    threshold: 3,
    owners: 5,
    balance: '31900000',
  }),
]

const createMockItems = (count: number): SafeItemData[] =>
  Array.from({ length: count }, (_, i) => createMockSafeItem(i))

const mockItemsLong = createMockItems(7)

// Interactive wrapper component to manage state
const InteractiveWrapper = ({ items, initialItemId }: { items: SafeItemData[]; initialItemId: string }) => {
  const [selectedItemId, setSelectedItemId] = useState(initialItemId)

  return (
    <SafeSelectorDropdown
      items={items}
      selectedItemId={selectedItemId}
      onItemSelect={(itemId: string) => {
        action('Item selected')(itemId)
        setSelectedItemId(itemId)
      }}
    />
  )
}

/** One safe with only one chain: threshold badge visible, no divider line or chevron. */
const singleChainItem: SafeItemData = createMockSafeItem(0, {
  id: '1:0xa77de01c5b6f829cbe4604cf71ddc8c4d608b000',
  name: 'My Safe',
  address: '0xa77de01c5b6f829cbe4604cf71ddc8c4d608b000',
  threshold: 3,
  owners: 5,
  balance: '16780000',
  chains: [baseChains[0]],
})

export const Default: Story = {
  render: () => <InteractiveWrapper items={mockItems} initialItemId={mockItems[0].id} />,
  args: {} as any,
}

export const SingleSafeSingleChain: Story = {
  render: () => <InteractiveWrapper items={[singleChainItem]} initialItemId={singleChainItem.id} />,
  args: {} as any,
}

export const SingleSafeMultiChains: Story = {
  render: () => <InteractiveWrapper items={[mockItems[0]]} initialItemId={mockItems[0].id} />,
  args: {} as any,
}

export const MultipleSafes: Story = {
  render: () => <InteractiveWrapper items={mockItemsLong} initialItemId={mockItemsLong[1].id} />,
  args: {} as any,
}

const mockItemsWithNested: SafeItemData[] = [
  createMockSafeItem(0, {
    id: '1:0xa77de01c5b6f829cbe4604cf71ddc8c4d608b000',
    name: 'Parent Safe',
    address: '0xa77de01c5b6f829cbe4604cf71ddc8c4d608b000',
    threshold: 3,
    owners: 5,
    balance: '16780000',
  }),
  createMockSafeItem(1, {
    id: '100:0x86753fe4b8e29ce8a38cdf9559d80e05b00cdba0',
    name: 'Nested Safe 1',
    address: '0x86753fe4b8e29ce8a38cdf9559d80e05b00cdba0',
    threshold: 2,
    owners: 3,
    balance: '5000000',
    parentSafeId: '1:0xa77de01c5b6f829cbe4604cf71ddc8c4d608b000',
  }),
  createMockSafeItem(2, {
    id: '8453:0x86753fe4b8e29ce8a38cdf9559d80e05b0abcdef',
    name: 'Nested Safe 2',
    address: '0x86753fe4b8e29ce8a38cdf9559d80e05b0abcdef',
    threshold: 2,
    owners: 4,
    balance: '3200000',
    parentSafeId: '1:0xa77de01c5b6f829cbe4604cf71ddc8c4d608b000',
  }),
  createMockSafeItem(3, {
    id: '137:0x9988776655443322110099887766554433221100',
    name: 'Another Parent',
    address: '0x9988776655443322110099887766554433221100',
    threshold: 4,
    owners: 7,
    balance: '25000000',
  }),
]

export const WithNestedSafes: Story = {
  render: () => <InteractiveWrapper items={mockItemsWithNested} initialItemId={mockItemsWithNested[0].id} />,
  args: {} as any,
}
