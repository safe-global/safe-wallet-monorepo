import type { Meta, StoryObj } from '@storybook/react'
import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { createMockStory } from '@/stories/mocks'
import SpacePlansPage from './Page'
import { DAY, SPACE_ID, billingHandlers, now, subscription } from './plans.fixtures'

const options = {
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true, safePro: true },
  pathname: '/spaces/plans',
  query: { spaceId: SPACE_ID },
  layout: 'paper',
  shadcn: true,
} as const
const setup = createMockStory(options)
const setupV2 = createMockStory({ ...options, features: { ...options.features, safeProPlansV2: true } })

const withBilling = (subscriptions: Subscription[], { parameters, handlers } = setup) => ({
  ...parameters,
  msw: { handlers: [...billingHandlers(subscriptions), ...handlers] },
})

const meta = {
  title: 'Features/Spaces/Plans/SpacePlansPage',
  component: SpacePlansPage,
  args: { spaceId: SPACE_ID },
  decorators: [setup.decorator],
} satisfies Meta<typeof SpacePlansPage>

export default meta
type Story = StoryObj<typeof meta>

/** The Plans page wired to billing: Business on free access with a month left. */
export const Trial: Story = { parameters: withBilling([subscription({ currentPeriodEnd: now() + 30 * DAY })]) }

/** A paid Business plan. */
export const Active: Story = { parameters: withBilling([subscription({ status: 'active', hasPaymentMethod: true })]) }

/** The redesigned page behind SAFE_PRO_PLANS_V2, on free access with a month left. */
export const RedesignedTrial: Story = {
  parameters: withBilling([subscription({ currentPeriodEnd: now() + 30 * DAY })], setupV2),
  decorators: [setupV2.decorator],
}
