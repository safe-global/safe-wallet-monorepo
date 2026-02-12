import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { action } from '@storybook/addon-actions'
import { useState } from 'react'
import SafeSelectorDropdown from './index'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  layout: 'none',
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

const mockSafes = [
  {
    id: '1:0xA77DE...98b6',
    name: 'My Safe',
    address: '0xA77D...98b6',
    threshold: 3,
    owners: 5,
    balance: '$16.78M',
    chains: baseChains,
  },
  {
    id: '100:0x8675...cdba',
    name: 'Another Safe',
    address: '0x8675...cdba',
    threshold: 3,
    owners: 5,
    balance: '$40.07M',
    chains: baseChains,
  },
  {
    id: '8453:0x8675...abcd',
    name: 'One more Safe',
    address: '0x8675...abcd',
    threshold: 3,
    owners: 5,
    balance: '$31.9M',
    chains: baseChains,
  },
]

const safeNames = [
  'Treasury',
  'DAO Multisig',
  'Team Operations',
  'Grants Committee',
  'Marketing Wallet',
  'Legal Reserve',
  'Payroll Safe',
]

const createMockSafesLong = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${baseChains[i % baseChains.length].chainId}:0x${(i + 1).toString(16).padStart(4, '0')}...${(i + 100).toString(16).padStart(4, '0')}`,
    name: safeNames[i % safeNames.length],
    address: `0x${(i + 1).toString(16).padStart(4, '0')}...${(i + 100).toString(16).padStart(4, '0')}`,
    threshold: 2 + (i % 2),
    owners: 3 + (i % 4),
    balance: `$${(1 + (i % 50)).toFixed(2)}M`,
    chains: baseChains,
  }))

const mockSafesLong = createMockSafesLong(7)

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

export const Default: Story = {
  render: () => <InteractiveWrapper safes={mockSafes} initialSafeId={mockSafes[0].id} />,
  args: {
    safes: mockSafes,
  },
}

export const SingleSafe: Story = {
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
