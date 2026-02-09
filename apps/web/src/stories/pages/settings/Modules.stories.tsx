import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Modules from '@/pages/settings/modules'

/**
 * Settings Modules page - manage Safe modules.
 * View and configure transaction guards and modules.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/settings/modules',
})

const meta = {
  title: 'Pages/Core/Settings/Modules',
  component: Modules,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Modules>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
