import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import SpaceSecurity from '@/pages/spaces/security'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  layout: 'fullPage',
  pathname: '/spaces/security',
  features: { spaces: true },
  query: { spaceId: '1' },
})

const meta = {
  title: 'Pages/Spaces/Security',
  component: SpaceSecurity,
  parameters: { layout: 'fullscreen', ...defaultSetup.parameters },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof SpaceSecurity>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
