import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import UnavailableSafesAlert from '.'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'paper',
  shadcn: true,
})

const meta = {
  title: 'Features/Spaces/Transactions/UnavailableSafesAlert',
  component: UnavailableSafesAlert,
  args: {
    spaceId: '1',
    onRetry: fn(),
    safes: [
      { chainId: '1', safeAddress: '0x1111111111111111111111111111111111111111' },
      { chainId: '137', safeAddress: '0x2222222222222222222222222222222222222222' },
    ],
  },
  parameters: { ...setup.parameters },
  decorators: [setup.decorator],
} satisfies Meta<typeof UnavailableSafesAlert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const OneSafe: Story = {
  args: { safes: [{ chainId: '1', safeAddress: '0x1111111111111111111111111111111111111111' }] },
}

export const Retrying: Story = {
  args: { isRetrying: true },
}
