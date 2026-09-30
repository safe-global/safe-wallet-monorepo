import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import SpendingLimitNotSupported from './SpendingLimitNotSupported'

const meta: Meta<typeof SpendingLimitNotSupported> = {
  title: 'Components/Settings/SpendingLimits/SpendingLimitNotSupported',
  component: SpendingLimitNotSupported,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const setup = createMockStory({ layout: 'paper' })

/**
 * Shown in the New spending limit flow when the AllowanceModule is not deployed on the current chain.
 */
export const Default: Story = {
  parameters: setup.parameters,
  decorators: [setup.decorator],
}
