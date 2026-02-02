import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { createMockStory } from '@/stories/mocks'
import HiddenTokenButton from './index'

type StoryArgs = {
  showHiddenAssets?: boolean
  toggleShowHiddenAssets?: () => void
}

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  layout: 'paper',
})

const meta: Meta<StoryArgs> = {
  title: 'Components/Balances/HiddenTokenButton',
  component: HiddenTokenButton,
  parameters: { layout: 'centered', ...defaultSetup.parameters },
  decorators: [defaultSetup.decorator],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<StoryArgs>

export const NoHiddenTokens: Story = {
  args: { showHiddenAssets: false, toggleShowHiddenAssets: fn() },
}

export const WithHiddenTokens: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    layout: 'paper',

    store: {
      settings: {
        hiddenTokens: {
          '1': ['0x0000000000000000000000000000000000000000', '0x5aFE3855358E112B5647B952709E6165e1c1eEEe'],
        },
      },
    },
  })
  return {
    args: { showHiddenAssets: false, toggleShowHiddenAssets: fn() },
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()
