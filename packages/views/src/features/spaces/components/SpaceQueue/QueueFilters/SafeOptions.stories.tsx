import type { Meta, StoryObj } from '@storybook/react'
import { fn, screen } from 'storybook/test'
import SafeOptions from './SafeOptions'
import { InOpenMenu } from './storyDecorators'

const meta = {
  title: 'Features/Spaces/Transactions/QueueFilters/SafeOptions',
  component: SafeOptions,
  parameters: { layout: 'centered' },
  decorators: [InOpenMenu],
  args: {
    options: [
      { safeAddress: '0x1111111111111111111111111111111111111111', name: 'Treasury', count: 11, checked: true },
      { safeAddress: '0x2222222222222222222222222222222222222222', name: '', count: 8, checked: false },
    ],
    onToggle: fn(),
  },
} satisfies Meta<typeof SafeOptions>

export default meta
type Story = StoryObj<typeof meta>

/** A named Safe and an unnamed one, shown by its address. */
export const Default: Story = {
  play: async () => {
    await screen.findByText('Sorted by number of transactions')
  },
}

export const NoSafes: Story = {
  args: { options: [] },
  play: async () => {
    await screen.findByText('No Safe accounts')
  },
}
