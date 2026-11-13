import type { Meta, StoryObj } from '@storybook/react'
import { userEvent, within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import NewSpendingLimitFlow from './index'

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', shadcn: true })

const meta = {
  title: 'Components/TxFlow/NewSpendingLimit',
  component: NewSpendingLimitFlow,
  decorators: [setup.decorator],
  parameters: { layout: 'fullscreen', ...setup.parameters },
} satisfies Meta<typeof NewSpendingLimitFlow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ZeroAmountError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(await canvas.findByTestId('token-amount-field'), '0')
    // Validation runs after the keystroke
    await canvas.findByText('The value must be greater than 0')
  },
}

export const ResetTimeDropdownOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByTestId('time-period-section'))
  },
}
