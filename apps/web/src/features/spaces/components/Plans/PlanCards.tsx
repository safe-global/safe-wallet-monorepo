import { SAFE_PRO_PRICING_URL } from '@/config/constants'
import { CONTACT_SALES_URL } from '@/features/spaces/constants'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { MixpanelEventParams, PlanCtaKind, type PlanLocation } from '@/services/analytics/mixpanel-events'
import { getPlanCta, pickProps } from './planTiers'
import type {
  CurrentPlan,
  PlanCta as PlanCtaKindOf,
  PlanPick,
  PlanSeatOption,
  PlanTier,
} from '@views/features/spaces/components/Plans/types'
import {
  PlanCardsView,
  PlanCardView,
  PlanCatalogView,
  PlanCtaView,
  type CurrentBadge,
} from '@views/features/spaces/components/Plans/PlanCardsView'

export type { CurrentBadge } from '@views/features/spaces/components/Plans/PlanCardsView'
export { READ_ONLY_NOTE, YEARLY_SAVINGS_LABEL } from '@views/features/spaces/components/Plans/PlanCardsView'

const CTA_KIND: Partial<Record<PlanCtaKindOf['kind'], PlanCtaKind>> = {
  billing: PlanCtaKind.ADD_PAYMENT_METHOD,
  change: PlanCtaKind.SWITCH_PLAN,
  subscribe: PlanCtaKind.CONTINUE_WITH_PLAN,
}

export type PlanCardActions = {
  /** Move to, or buy, the picked offer. */
  onSubscribe?: (pick: PlanPick) => void
  /** Manage the current plan: the Stripe portal for billing details, invoices or cancellation. */
  onManage?: () => void
  isBusy?: boolean
  currentPlan?: CurrentPlan
  currentBadge?: CurrentBadge
  /** Without a live plan, the tier that gets the primary button; the others read as a switch. */
  recommendedPlan?: string
  /** A question shown under the seats ("Need more than 20?") followed by a link to sales. */
  salesHint?: (tier: PlanTier) => string | undefined
  /** A viewer who cannot act on the plan (a Workspace member who is not an admin): the cards show no buttons. */
  readOnly?: boolean
  /** Where the catalog is shown, for analytics. */
  location: PlanLocation
  /** Any plan button was clicked, before its action runs. */
  onCta?: (pick: PlanPick, cta: PlanCtaKindOf) => void
}

const PlanCta = ({
  pick,
  currentPlan,
  recommendedPlan,
  onSubscribe,
  onManage,
  isBusy,
  location,
  onCta,
}: { pick: PlanPick } & PlanCardActions) => {
  const cta = getPlanCta(pick, currentPlan, recommendedPlan)
  const clicked = () => {
    trackEvent(SAFE_PRO_EVENTS.PLAN_CTA_CLICKED, {
      ...pickProps(pick),
      [MixpanelEventParams.CTA]: CTA_KIND[cta.kind],
      [MixpanelEventParams.PLAN_IS_CURRENT]: Boolean(pick.tier.isCurrent),
      [MixpanelEventParams.LOCATION]: location,
    })
    onCta?.(pick, cta)
  }

  return (
    <PlanCtaView
      cta={cta}
      isBusy={isBusy}
      salesUrl={CONTACT_SALES_URL}
      onSales={() => onCta?.(pick, cta)}
      onActivate={() => {
        clicked()
        if (cta.kind === 'billing') onManage?.()
        else onSubscribe?.(pick)
      }}
      onManage={onManage}
    />
  )
}

export const PlanCard = ({
  tier,
  selected,
  onSelect,
  onOptionChange,
  preferredSeats,
  currentBadge,
  salesHint,
  ...actions
}: {
  tier: PlanTier
  selected?: boolean
  onSelect?: () => void
  onOptionChange?: (option: PlanSeatOption) => void
  preferredSeats?: string
} & PlanCardActions) => (
  <PlanCardView
    tier={tier}
    selected={selected}
    onSelect={onSelect}
    onOptionChange={onOptionChange}
    preferredSeats={preferredSeats}
    currentBadge={currentBadge}
    salesHint={salesHint}
    readOnly={actions.readOnly}
    salesUrl={CONTACT_SALES_URL}
    renderCta={(pick) => <PlanCta pick={pick} {...actions} />}
  />
)

/** Billing-cycle toggle plus one card per visible tier; the Plans page wraps it in a card, dialogs use it bare. */
export function PlanCatalog({
  tiers,
  ...actions
}: {
  tiers: PlanTier[]
} & PlanCardActions) {
  return (
    <PlanCatalogView
      tiers={tiers}
      pricingUrl={SAFE_PRO_PRICING_URL}
      renderCard={(tier, cardProps) => <PlanCard tier={tier} {...cardProps} {...actions} />}
    />
  )
}

export default function PlanCards(props: { tiers: PlanTier[] } & PlanCardActions) {
  return <PlanCardsView catalog={<PlanCatalog {...props} />} readOnly={props.readOnly} />
}
