import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Button } from '@/components/ui/button'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { withMockProvider } from '@/storybook/preview'
import { PROPOSER_INTRO_SEEN_KEY } from './ProposerIntroDialog/constants'
import { SPENDING_LIMIT_INTRO_SEEN_KEY } from './SpendingLimitIntroDialog/constants'
import { mockStarterPlan } from './mocks/plan'
import Policies from './index'

const meta = {
  title: 'Features/Spaces/Policies',
  component: Policies,
  // The dialog is portalled into `.shadcn-scope`, which only the provider sets up.
  decorators: [withMockProvider({ shadcn: true })],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Policies>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SpendingLimitIntro: Story = {
  render: function SpendingLimitIntroStory() {
    const [, setHasSeenIntro] = useLocalStorage<boolean>(SPENDING_LIMIT_INTRO_SEEN_KEY)

    return (
      <div className="flex flex-col items-start gap-6">
        <Button variant="outline" onClick={() => setHasSeenIntro(false)}>
          Forget that the intro was seen
        </Button>

        <Policies />
      </div>
    )
  },
}

export const ProposerIntro: Story = {
  render: function ProposerIntroStory() {
    const [, setHasSeenIntro] = useLocalStorage<boolean>(PROPOSER_INTRO_SEEN_KEY)

    return (
      <div className="flex flex-col items-start gap-6">
        <Button variant="outline" onClick={() => setHasSeenIntro(false)}>
          Forget that the intro was seen
        </Button>

        <Policies />
      </div>
    )
  },
}

/** The workspace is on a plan that does not include policies: the banner shows and every policy tile is gated. */
export const Starter: Story = {
  args: { lockedPlan: mockStarterPlan, onUpgrade: fn() },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="bg-muted p-6">
        <Story />
      </div>
    ),
  ],
}
