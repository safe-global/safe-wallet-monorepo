import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import { Typography } from '@/components/ui/typography'
import { WorkspaceTwoFactorAwarenessCard } from '@/features/oidc-auth'
import { SidebarBannerCarousel } from './SidebarBannerCarousel'

const defaultSetup = createMockStory({
  features: { spaces: true, oidcAuth: true, twoFactorAwarenessBanner: true },
  pathname: '/spaces',
  query: { spaceId: '1' },
  shadcn: true,
})

const SecondBanner = () => (
  <div className="flex w-full flex-col gap-1 rounded-lg bg-muted p-4 shadow-lg">
    <Typography variant="paragraph-small-bold">Another announcement</Typography>
    <Typography variant="paragraph-mini" color="muted">
      Stands in for whichever banner shares the slot.
    </Typography>
  </div>
)

const meta = {
  title: 'Features/Spaces/SidebarBannerCarousel',
  component: SidebarBannerCarousel,
  tags: ['autodocs'],
  loaders: [mswLoader],
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
} satisfies Meta<typeof SidebarBannerCarousel>

export default meta
type Story = StoryObj<typeof meta>

export const SingleBanner: Story = {
  args: {
    children: <WorkspaceTwoFactorAwarenessCard spaceId="1" onDismiss={() => undefined} />,
  },
}

export const TwoBanners: Story = {
  args: {
    children: [
      <WorkspaceTwoFactorAwarenessCard key="2fa" spaceId="1" onDismiss={() => undefined} />,
      <SecondBanner key="second" />,
    ],
  },
}
