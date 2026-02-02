import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import CurrencySelect from './index'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  layout: 'paper',
})

const meta: Meta<typeof CurrencySelect> = {
  title: 'Components/Base/CurrencySelect',
  component: CurrencySelect,
  parameters: { layout: 'centered', ...defaultSetup.parameters },
  decorators: [defaultSetup.decorator],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
