import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import CreateSafe from '@/pages/new-safe/create'

/**
 * Create Safe page - simple Safe creation flow.
 * Guides users through creating a new Safe Account.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
})

const meta = {
  title: 'Pages/Onboarding/NewSafe/Create',
  component: CreateSafe,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof CreateSafe>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
