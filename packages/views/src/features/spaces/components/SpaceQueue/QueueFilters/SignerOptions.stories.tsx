import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import SignerOptions from './SignerOptions'
import { InOpenMenu } from './storyDecorators'

const meta = {
  title: 'Features/Spaces/Transactions/QueueFilters/SignerOptions',
  component: SignerOptions,
  parameters: { layout: 'centered' },
  decorators: [InOpenMenu],
  args: {
    options: [
      { address: '0x3333333333333333333333333333333333333333', name: 'Alice (you)', count: 10, checked: false },
      { address: '0x4444444444444444444444444444444444444444', name: '0x4444...4444', count: 3, checked: true },
    ],
    onToggle: fn(),
  },
} satisfies Meta<typeof SignerOptions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoSigners: Story = {
  args: { options: [] },
}
