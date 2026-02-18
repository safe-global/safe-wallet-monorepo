import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import TotalAssetValue from './index'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  layout: 'paper',
})

const meta: Meta<typeof TotalAssetValue> = {
  title: 'Components/Balances/TotalAssetValue',
  component: TotalAssetValue,
  parameters: { layout: 'centered', ...defaultSetup.parameters },
  decorators: [defaultSetup.decorator],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { fiatTotal: '142567.89', title: 'Total value' },
}

export const Loading: Story = {
  args: { fiatTotal: undefined, title: 'Total value' },
}
