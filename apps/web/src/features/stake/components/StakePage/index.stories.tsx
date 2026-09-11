import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import { AppRoutes } from '@/config/routes'
import StakePage from './index'

// StakePage reads the connected Safe, the Next.js router (for the `asset` query param),
// the OFAC sanctions check and a localStorage consent flag. On first visit the consent
// flag is unset, so the page renders the third-party widget disclaimer — the primary,
// reliably-renderable state shown here. Once accepted, the page embeds the Kiln staking
// widget in an iframe (AppFrame) that cannot load in isolation, so that branch is omitted.
const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  pathname: AppRoutes.stake,
  shadcn: true,
})

const meta = {
  title: 'Features/Stake/StakePage',
  component: StakePage,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
  },
} satisfies Meta<typeof StakePage>

export default meta

type Story = StoryObj<typeof meta>

// First visit: the user has not yet accepted the third-party widget disclaimer.
export const ConsentDisclaimer: Story = {}
