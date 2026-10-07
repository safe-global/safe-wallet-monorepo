import type { Meta, StoryObj } from '@storybook/react'
import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { createMockStory } from '@/stories/mocks'
import SpacePlansPage from './Page'
import { DAY, SPACE_ID, billingHandlers, now, subscription } from './plans.fixtures'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true, safePro: true },
  pathname: '/spaces/plans',
  query: { spaceId: SPACE_ID },
  layout: 'paper',
  shadcn: true,
})

const withBilling = (subscriptions: Subscription[]) => ({
  ...setup.parameters,
  msw: { handlers: [...billingHandlers(subscriptions), ...setup.handlers] },
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
