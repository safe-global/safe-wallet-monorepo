import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { action } from '@storybook/addon-actions'
import { useState } from 'react'
import SafeSelectorDropdown from './index'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  layout: 'none',
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
    safes: { control: 'object' },
    selectedSafeId: { control: 'text' },
    onSafeChange: { action: 'Safe changed' },
    onChainChange: { action: 'Chain changed' },
  },
} satisfies Meta<typeof SafeSelectorDropdown>

export default meta
type Story = StoryObj<typeof meta>

const baseChains = [
  { chainId: '1', chainName: 'Ethereum', chainLogoUri: undefined },
  { chainId: '100', chainName: 'Gnosis Chain', chainLogoUri: undefined },
  { chainId: '8453', chainName: 'Base', chainLogoUri: undefined },
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

const createMockAddress = (index: number) =>
  `0x${index.toString(16).padStart(4, '0')}...${(index + 100).toString(16).padStart(4, '0')}`

/** Fiat balance as numeric string; FiatValue will format (e.g. to $16.78M) */
const createMockSafe = (index: number, overrides = {}) => ({
  id: `${baseChains[index % baseChains.length].chainId}:${createMockAddress(index + 1)}`,
  name: SAFE_NAMES[index % SAFE_NAMES.length],
  address: createMockAddress(index + 1),
  threshold: 2 + (index % 2),
  owners: 3 + (index % 4),
  balance: String((1 + (index % 50)) * 1_000_000),
  chains: baseChains,
  ...overrides,
})

const mockSafes = [
  createMockSafe(0, {
    id: '1:0xA77DE...98b6',
    name: 'My Safe',
    address: '0xA77D...98b6',
    threshold: 3,
    owners: 5,
    balance: '16780000',
  }),
  createMockSafe(1, {
    id: '100:0x8675...cdba',
    name: 'Another Safe',
    address: '0x8675...cdba',
    threshold: 3,
    owners: 5,
    balance: '40070000',
  }),
  createMockSafe(2, {
    id: '8453:0x8675...abcd',
    name: 'One more Safe',
    address: '0x8675...abcd',
    threshold: 3,
    owners: 5,
    balance: '31900000',
  }),
]

const createMockSafes = (count: number) => Array.from({ length: count }, (_, i) => createMockSafe(i))

const mockSafesLong = createMockSafes(7)

// Interactive wrapper component to manage state
const InteractiveWrapper = ({ safes, initialSafeId }: { safes: typeof mockSafes; initialSafeId: string }) => {
  const [selectedSafeId, setSelectedSafeId] = useState(initialSafeId)

  return (
    <SafeSelectorDropdown
      safes={safes}
      selectedSafeId={selectedSafeId}
      onSafeChange={(safeId: string) => {
        action('Safe changed')(safeId)
        setSelectedSafeId(safeId)
      }}
      onChainChange={action('Chain changed')}
    />
  )
}

/** One safe with only one chain: threshold badge visible, no divider line or chevron. */
const singleChainSafe = createMockSafe(0, {
  id: '1:0xA77DE...98b6',
  name: 'My Safe',
  address: '0xA77D...98b6',
  threshold: 3,
  owners: 5,
  balance: '16780000',
  chains: [baseChains[0]],
})

export const Default: Story = {
  render: () => <InteractiveWrapper safes={mockSafes} initialSafeId={mockSafes[0].id} />,
  args: {
    safes: [...mockSafes, singleChainSafe],
  },
}

export const SingleSafeSingleChain: Story = {
  render: () => <InteractiveWrapper safes={[singleChainSafe]} initialSafeId={singleChainSafe.id} />,
  args: {
    safes: [singleChainSafe],
  },
}

export const SingleSafeMultiChains: Story = {
  render: () => <InteractiveWrapper safes={[mockSafes[0]]} initialSafeId={mockSafes[0].id} />,
  args: {
    safes: [mockSafes[0]],
  },
}

export const MultipleSafes: Story = {
  render: () => <InteractiveWrapper safes={mockSafesLong} initialSafeId={mockSafesLong[1].id} />,
  args: {
    safes: mockSafesLong,
  },
}
