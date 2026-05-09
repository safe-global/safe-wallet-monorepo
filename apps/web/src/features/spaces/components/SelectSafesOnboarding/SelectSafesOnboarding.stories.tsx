import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import SelectSafesOnboarding from '.'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  pathname: '/welcome/select-safes',
  query: { spaceId: '1' },
  shadcn: true,
})

const meta = {
  component: SelectSafesOnboarding,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof SelectSafesOnboarding>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
