import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import CustomApps from '@/pages/apps/custom'

/**
 * Custom Safe Apps page - manage custom Safe Apps.
 * Allows adding and managing user-defined Safe Apps.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/apps/custom',
})

const meta = {
  title: 'Pages/Features/Apps/Custom',
  component: CustomApps,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof CustomApps>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
