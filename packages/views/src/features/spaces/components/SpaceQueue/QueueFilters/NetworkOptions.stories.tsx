import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import NetworkOptions from './NetworkOptions'
import { InOpenMenu } from './storyDecorators'

const meta = {
  title: 'Features/Spaces/Transactions/QueueFilters/NetworkOptions',
  component: NetworkOptions,
  parameters: { layout: 'centered' },
  decorators: [InOpenMenu],
  args: {
    options: [
      { chainId: '1', name: 'Ethereum', count: 12, checked: true },
      { chainId: '137', name: 'Polygon', count: 3, checked: false },
    ],
    onToggle: fn(),
  },
} satisfies Meta<typeof NetworkOptions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoNetworks: Story = {
  args: { options: [] },
}
