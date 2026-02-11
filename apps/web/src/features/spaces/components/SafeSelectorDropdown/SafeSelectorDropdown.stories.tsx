import type { Meta, StoryObj } from '@storybook/react'
import SafeSelectorDropdown from './index'

const meta = {
  title: 'Features/Spaces/SafeSelectorDropdown',
  component: SafeSelectorDropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SafeSelectorDropdown>

export default meta
type Story = StoryObj<typeof meta>

const baseChains = [
  { id: 'eth', name: 'Ethereum', logo: '' },
  { id: 'gnosis', name: 'Gnosis Chain', logo: '' },
  { id: 'base', name: 'Base', logo: '' },
]

const mockSafes = [
  {
    id: '1',
    name: 'My Safe',
    address: '0xA77D...98b6',
    threshold: 3,
    owners: 5,
    balance: '$16.78M',
    chains: baseChains,
  },
  {
    id: '2',
    name: 'Another Safe',
    address: '0x8675...cdba',
    threshold: 3,
    owners: 5,
    balance: '$40.07M',
    chains: baseChains,
  },
  {
    id: '3',
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
    id: String(i + 1),
    name: safeNames[i % safeNames.length],
    address: `0x${(i + 1).toString(16).padStart(4, '0')}...${(i + 100).toString(16).padStart(4, '0')}`,
    threshold: 2 + (i % 2),
    owners: 3 + (i % 4),
    balance: `$${(1 + (i % 50)).toFixed(2)}M`,
    chains: baseChains,
  }))

const mockSafesLong = createMockSafesLong(7)

export const Default: Story = {
  args: {
    safes: mockSafes,
    selectedSafeId: '1',
    onSafeChange: (safeId: string) => console.log('Safe changed:', safeId),
    onChainChange: (chainId: string) => console.log('Chain changed:', chainId),
  },
}

export const SingleSafe: Story = {
  args: {
    safes: [mockSafes[0]],
    selectedSafeId: '1',
  },
}

export const MultipleSafes: Story = {
  args: {
    safes: mockSafesLong,
    selectedSafeId: '2',
  },
}
