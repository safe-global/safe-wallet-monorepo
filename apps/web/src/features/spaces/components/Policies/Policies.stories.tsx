import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Button } from '@/components/ui/button'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { withMockProvider } from '@/storybook/preview'
import { PROPOSER_INTRO_SEEN_KEY } from './ProposerIntroDialog/constants'
import { SPENDING_LIMIT_INTRO_SEEN_KEY } from './SpendingLimitIntroDialog/constants'
import { mockPolicies } from './mocks/policies'
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

/** With policies the page becomes the list of what is set up. */
export const Populated: Story = {
  args: { policies: mockPolicies() },
}

/** Only the heading stays while CGW answers. */
export const Loading: Story = {
  args: { policies: [], isLoading: true },
}

/** The read path is atomic, so a failure replaces the page body rather than showing a partial list. */
export const Error: Story = {
  args: { policies: [], isError: true, onRetry: fn() },
}
