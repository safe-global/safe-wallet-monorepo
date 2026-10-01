import { useState, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import useWallet from '@/hooks/wallets/useWallet'
import { useCurrentChain } from '@/hooks/useChains'
import type { SponsoredOffer } from '@/utils/gasPayment'
import { ExecutionMethod, _ExecutionMethodSelector } from './index'

type SelectorStoryProps = Pick<
  ComponentProps<typeof _ExecutionMethodSelector>,
  'offer' | 'showsProUpsell' | 'isSafeProEnabled'
>

const SelectorStory = ({ offer, showsProUpsell, isSafeProEnabled }: SelectorStoryProps) => {
  const wallet = useWallet()
  const chain = useCurrentChain()
  const [executionMethod, setExecutionMethod] = useState<ExecutionMethod>(ExecutionMethod.RELAY)

  return (
    <_ExecutionMethodSelector
      wallet={wallet}
      chain={chain}
      isSafeProEnabled={isSafeProEnabled}
      executionMethod={executionMethod}
      setExecutionMethod={setExecutionMethod}
      offer={offer}
      showsProUpsell={showsProUpsell}
    />
  )
}

const setup = createMockStory({ wallet: 'connected', layout: 'paper' })

const meta = {
  title: 'Components/TxFlow/ExecutionMethodSelector',
  component: SelectorStory,
  parameters: { ...setup.parameters },
  decorators: [setup.decorator],
  args: { isSafeProEnabled: false, showsProUpsell: false },
} satisfies Meta<typeof SelectorStory>

export default meta
type Story = StoryObj<typeof meta>

const campaign = (
  disabledReason: Extract<SponsoredOffer, { option: 'NO_FEE_CAMPAIGN' }>['disabledReason'],
  remaining: number,
): SponsoredOffer => ({ option: 'NO_FEE_CAMPAIGN', disabledReason, remaining, limit: 10 })

const daily = (isPro = false): SponsoredOffer => ({
  option: 'FREE_DAILY_LIMIT',
  disabledReason: null,
  relays: { remaining: 4, limit: 5 },
  isPro,
})

const subscription = (left: number): SponsoredOffer => ({
  option: 'SUBSCRIPTION',
  disabledReason: left === 0 ? 'LIMIT_REACHED' : null,
  spaceId: '1',
  left,
  meter: { used: 50 - left, quota: 50, resetsAt: '2026-11-01T00:00:00.000Z' },
})

export const CampaignAvailable: Story = { args: { offer: campaign(null, 3) } }

/** The gas banner is a lazily loaded feature that stories keep disabled, so only the chip and tooltip render. */
export const CampaignGasTooHigh: Story = { args: { offer: campaign('GAS_TOO_HIGH', 3) } }

export const CampaignLimitReached: Story = { args: { offer: campaign('LIMIT_REACHED', 0) } }

export const DailyRelays: Story = { args: { offer: daily() } }

export const DailyRelaysWithSafePro: Story = { args: { offer: daily(), isSafeProEnabled: true } }

export const DailyRelaysProSafe: Story = { args: { offer: daily(true), isSafeProEnabled: true } }

export const SubscriptionAvailable: Story = { args: { offer: subscription(30), isSafeProEnabled: true } }

export const SubscriptionExhausted: Story = { args: { offer: subscription(0), isSafeProEnabled: true } }

export const ProUpsellOnly: Story = { args: { offer: null, showsProUpsell: true, isSafeProEnabled: true } }
