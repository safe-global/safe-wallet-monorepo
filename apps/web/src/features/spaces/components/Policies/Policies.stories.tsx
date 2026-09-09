import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/button'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { withMockProvider } from '@/storybook/preview'
import { SPENDING_LIMIT_INTRO_SEEN_KEY } from './SpendingLimitIntroDialog/constants'
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

/**
 * Click the Spending limit tile: the intro opens. Dismiss it and click again: nothing opens, since
 * the flow behind it lands in WA-3150. Forget that it was seen, and the intro is back.
 */
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
