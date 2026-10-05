import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import type { PaymentLink, Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { createMockStory } from '@/stories/mocks'
import ChangePlanDialog from './ChangePlanDialog'
import ClaimTrialModal from './ClaimTrialModal'
import PlanChooserModal from './PlanChooserModal'
import SelectAccountsStep from './SelectAccountsStep'
import TrialEndingModal from './TrialEndingModal'
import { buildPlanTiers, toCurrentPlan } from './planTiers'
import {
  DAY,
  PAID_LINKS,
  PAID_PLANS,
  SPACE_ID,
  TRIAL_LINKS,
  billingHandlers,
  now,
  subscription,
} from './plans.fixtures'

const options = {
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true, safePro: true },
  pathname: '/spaces',
  query: { spaceId: SPACE_ID },
  shadcn: true,
} as const
const setup = createMockStory(options)
const setupV2 = createMockStory({ ...options, features: { ...options.features, safeProPlansV2: true } })

const withBilling = (
  subscriptions: Subscription[],
  links: PaymentLink[] = PAID_LINKS,
  { parameters, handlers } = setup,
) => ({
  ...parameters,
  msw: {
    handlers: [
      ...billingHandlers(subscriptions, links),
      http.get(/\/v1\/spaces\/[^/]+\/safes$/, () => HttpResponse.json({ safes: SPACE_SAFES })),
      ...handlers,
    ],
  },
})

const SPACE_SAFES = {
  '1': ['0xA77DE01e157f9f57C7c4A326eeEaf0BDD2CFcD01', '0xB63F3D0a4a7eFd1d0c08A9ef17C5e5d3DbBDE867'],
  '137': ['0xA77DE01e157f9f57C7c4A326eeEaf0BDD2CFcD01'],
}

const trial = subscription()
const [starterTier] = buildPlanTiers(PAID_PLANS, { subscription: trial, seatsQuota: 20 })
const trialPlan = toCurrentPlan(
  trial,
  { name: 'Business', status: 'trialing', periodEndsAt: null, daysLeft: 5 },
  true,
  20,
)

const meta = {
  title: 'Features/Spaces/Plans/PlanModals',
  parameters: { layout: 'fullscreen' },
  decorators: [setup.decorator],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Last week of free access without a payment method; shown once per login on every Workspace page. */
export const TrialEnding: Story = {
  parameters: withBilling([trial]),
  render: () => <TrialEndingModal spaceId={SPACE_ID} />,
}

/** Free access ended without a plan: the Workspace is locked until an admin picks one. */
export const LockedTrialEnded: Story = {
  parameters: withBilling([
    subscription({ status: 'canceled', currentPeriodEnd: now() - 2 * DAY, cancelledAt: now() - 2 * DAY }),
  ]),
  render: () => (
    <PlanChooserModal spaceId={SPACE_ID} reason="lapsed" endedAt={(now() - 2 * DAY) * 1000} onBack={() => {}} />
  ),
}

/** A Workspace that never had a plan: locked until an admin picks one. */
export const LockedNoPlan: Story = {
  parameters: withBilling([]),
  render: () => <PlanChooserModal spaceId={SPACE_ID} reason="lapsed" endedAt={null} onBack={() => {}} />,
}

/** Trial Ending with the redesigned plan cards behind SAFE_PRO_PLANS_V2. */
export const RedesignedTrialEnding: Story = {
  parameters: withBilling([trial], PAID_LINKS, setupV2),
  decorators: [setupV2.decorator],
  render: TrialEnding.render,
}

/** Locked Trial Ended with the redesigned plan cards behind SAFE_PRO_PLANS_V2. */
export const RedesignedLockedTrialEnded: Story = {
  parameters: withBilling(
    [subscription({ status: 'canceled', currentPeriodEnd: now() - 2 * DAY, cancelledAt: now() - 2 * DAY })],
    PAID_LINKS,
    setupV2,
  ),
  decorators: [setupV2.decorator],
  render: LockedTrialEnded.render,
}

/** Locked No Plan with the redesigned plan cards behind SAFE_PRO_PLANS_V2. */
export const RedesignedLockedNoPlan: Story = {
  parameters: withBilling([], PAID_LINKS, setupV2),
  decorators: [setupV2.decorator],
  render: LockedNoPlan.render,
}

/** The last payment failed: the Workspace is locked until billing is fixed or another plan is picked. */
export const LockedPaymentFailed: Story = {
  parameters: withBilling([subscription({ status: 'past_due', hasPaymentMethod: true })]),
  render: () => <PlanChooserModal spaceId={SPACE_ID} reason="payment-failed" endedAt={null} onBack={() => {}} />,
}

/** Right after creating a Workspace, or opening a locked one that can still start free access. */
export const ClaimFreeAccess: Story = {
  parameters: withBilling([], TRIAL_LINKS),
  render: () => <ClaimTrialModal spaceId={SPACE_ID} onBack={() => {}} />,
}

/** Switching plan during free access: no proration preview, the switch is explained instead. */
export const ChangePlanDuringTrial: Story = {
  parameters: withBilling([trial]),
  render: () => (
    <ChangePlanDialog
      spaceId={SPACE_ID}
      pick={{ tier: starterTier, option: starterTier.options[0] }}
      currentPlan={trialPlan}
      onClose={() => {}}
      onChanged={() => {}}
    />
  ),
}

/** Moving to a plan with fewer seats than the Workspace has Safes: the admin picks which ones stay. */
export const SelectAccounts: Story = {
  parameters: withBilling([trial]),
  render: () => (
    <Dialog open>
      <DialogContent size="md" surface="card" padding="sm" showCloseButton={false}>
        <SelectAccountsStep limit={2} planName="Starter" onBack={() => {}} onContinue={() => {}} />
      </DialogContent>
    </Dialog>
  ),
}
