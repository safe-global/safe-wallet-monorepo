import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import WorkspaceTwoFactorAwarenessCard from './index'

const defaultSetup = createMockStory({
  features: { spaces: true, oidcAuth: true, twoFactorAwarenessBanner: true },
  pathname: '/spaces',
  query: { spaceId: '1' },
  shadcn: true,
})

const meta = {
  title: 'Features/OidcAuth/WorkspaceTwoFactorAwarenessCard',
  component: WorkspaceTwoFactorAwarenessCard,
  tags: ['autodocs'],
  decorators: [
    defaultSetup.decorator,
    (Story) => (
      <div className="flex justify-center bg-sidebar p-6">
        {/* The real sidebar content column */}
        <div className="w-[226px]">
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: defaultSetup.parameters,
} satisfies Meta<typeof WorkspaceTwoFactorAwarenessCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { spaceId: '1', onDismiss: () => undefined },
}
