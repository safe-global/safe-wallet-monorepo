import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Appearance from '@/pages/settings/appearance'

/**
 * Settings Appearance page - customize visual preferences.
 * Theme selection and display options.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/settings/appearance',
})

const meta = {
  title: 'Pages/Core/Settings/Appearance',
  component: Appearance,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Appearance>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
