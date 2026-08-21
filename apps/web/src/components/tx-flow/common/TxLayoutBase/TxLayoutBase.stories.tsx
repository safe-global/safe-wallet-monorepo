import type { Meta, StoryObj } from '@storybook/react'
import { Rocket } from 'lucide-react'
import { faker } from '@faker-js/faker'
import TxLayoutBase from './index'
import TxCard, { TxCardActions } from '../TxCard'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import { createInitialState } from '@/stories/mocks/defaults'
import { safeFixtures } from '@safe-global/test/msw/fixtures'
import commonCss from '../styles.module.css'

faker.seed(456)

/** The card body every review step shares: copy, a bled divider, then the submit row. */
const ReviewStep = () => (
  <TxCard>
    <Typography>
      You&apos;re about to deploy this Safe account and will have to confirm the transaction with your connected wallet.
    </Typography>

    <Separator className={commonCss.nestedDivider} />

    <TxCardActions className="!mt-0">
      <Button size="submit">Activate</Button>
    </TxCardActions>
  </TxCard>
)

const meta: Meta<typeof TxLayoutBase> = {
  title: 'Components/TxFlow/TxLayoutBase',
  component: TxLayoutBase,
  parameters: { layout: 'padded' },
  args: {
    step: 0,
    stepCount: 1,
    progress: 100,
    hideSafeShield: true,
    children: <ReviewStep />,
  },
  decorators: [
    (Story, context) => (
      <StoreDecorator
        initialState={createInitialState({
          safeData: safeFixtures.efSafe,
          isDarkMode: context.globals?.theme === 'dark',
        })}
        context={context}
      >
        <RouterDecorator>
          <Story />
        </RouterDecorator>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * The shape every flow should have: the progress bar and the header row (icon + subtitle, and the
 * nonce chip where it applies) sit in a strip tall enough to show the card's 24px top radius, and
 * the card below is squared off so the two read as one surface.
 */
export const WithHeader: Story = {
  args: {
    title: 'Activate account',
    subtitle: 'Deploy Safe account',
    icon: Rocket,
    hideNonce: true,
  },
}

/**
 * No subtitle, icon or nonce to show — as in Reject transaction. The strip is dropped entirely and
 * the progress bar rides the card's own rounded top, rather than becoming a 6px sliver that cannot
 * render a 24px corner and reads as a stray line above a square-topped card.
 */
export const WithoutHeader: Story = {
  args: {
    title: 'Reject transaction',
    hideNonce: true,
  },
}

/** A mid-flow step: the Back button appears, and the submit row reserves room for it below 1200px. */
export const MidFlowWithBackButton: Story = {
  args: {
    title: 'New transaction',
    subtitle: 'Send tokens',
    step: 1,
    stepCount: 3,
    progress: 66,
    onBack: () => {},
  },
}
