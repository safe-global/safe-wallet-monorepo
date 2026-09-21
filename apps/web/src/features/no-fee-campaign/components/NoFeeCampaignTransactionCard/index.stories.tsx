import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory, createChainData, createChainsPageData } from '@/stories/mocks'
import { createChainsPageDataV2 } from '@/stories/mocks/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import NoFeeCampaignTransactionCard from './index'

// The card renders only when the NO_FEE_NOVEMBER feature is enabled on the
// chain, so serve a chain config with the feature added. Eligibility comes
// from the relay quota endpoint: a positive limit marks the Safe as eligible.
const chainData = createChainData()
chainData.features = [...chainData.features, FEATURES.NO_FEE_NOVEMBER]

const chainHandlers = [
  http.get(/\/v1\/chains\/\d+\/relay\/0x[a-fA-F0-9]+$/, () => HttpResponse.json({ remaining: 5, limit: 5 })),
  http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
  http.get(/\/v1\/chains$/, () => HttpResponse.json(createChainsPageData(chainData))),
  http.get(/\/v2\/chains$/, () => HttpResponse.json(createChainsPageDataV2(chainData))),
]

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
})

const meta = {
  title: 'Features/NoFeeCampaign/NoFeeCampaignTransactionCard',
  component: NoFeeCampaignTransactionCard,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
    msw: { handlers: [...chainHandlers, ...setup.handlers] },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NoFeeCampaignTransactionCard>

export default meta
type Story = StoryObj<typeof meta>

// Eligible Safe: campaign card with the "You are eligible" tag.
export const Eligible: Story = {
  loaders: [mswLoader],
}
