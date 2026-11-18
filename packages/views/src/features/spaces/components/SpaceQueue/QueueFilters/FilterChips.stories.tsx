import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import FilterChips from './FilterChips'

const meta = {
  title: 'Features/Spaces/Transactions/QueueFilters/FilterChips',
  component: FilterChips,
  parameters: { layout: 'padded' },
  args: {
    safes: [],
    statuses: [],
    networkNames: [],
    signerNames: [],
    onRemove: fn(),
    onClear: fn(),
  },
} satisfies Meta<typeof FilterChips>

export default meta
type Story = StoryObj<typeof meta>

/** One chip per filter, naming two values and counting the rest. */
export const EveryFilter: Story = {
  args: {
    safes: [
      { safeAddress: '0x1111111111111111111111111111111111111111', name: 'Treasury' },
      { safeAddress: '0x2222222222222222222222222222222222222222', name: '' },
    ],
    statuses: ['sign', 'execute', 'blocked', 'conflicting'],
    networkNames: ['Ethereum', 'Polygon'],
    signerNames: ['Alice (you)'],
  },
}

export const OneFilter: Story = {
  args: { statuses: ['sign'] },
}
