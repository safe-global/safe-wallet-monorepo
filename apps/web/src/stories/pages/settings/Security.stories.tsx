import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Security from '@/pages/settings/security'

/**
 * Settings Security page - security features and signing methods.
 * Configure transaction validation and signing preferences.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/settings/security',
})

const meta = {
  title: 'Pages/Core/Settings/Security',
  component: Security,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Security>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
