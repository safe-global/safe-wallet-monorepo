import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Setup from '@/pages/settings/setup'

/**
 * Settings Setup page - displays Safe Account configuration.
 * Shows nonce, contract version, members, spending limits, and nested Safes.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/settings/setup',
})

const meta = {
  title: 'Pages/Core/Settings/Setup',
  component: Setup,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Setup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
