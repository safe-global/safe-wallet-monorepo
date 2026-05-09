import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import DataSettings from '@/pages/settings/data'

/**
 * Settings Data page - import/export Safe data.
 * Backup and restore address book and settings.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/settings/data',
})

const meta = {
  title: 'Pages/Core/Settings/Data',
  component: DataSettings,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof DataSettings>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
