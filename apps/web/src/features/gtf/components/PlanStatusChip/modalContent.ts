import { AppRoutes } from '@/config/routes'
import type { PlanStatus, PlanTier } from './types'
import { PRO_PLUS_TIER, PRO_TIER, STARTER_TIER } from './mocks'

export interface ModalCta {
  label: string
  href: string
}

export interface PlanComparison {
  activeTierId: string
  tiers: [PlanTier, PlanTier]
}

export interface ModalContent {
  cta: ModalCta
  comparison?: PlanComparison
  showSafesSelector: boolean
  showPaygFootnote: boolean
}

const billingHref = (spaceId: string | null): string =>
  spaceId ? `${AppRoutes.spaces.billing}?spaceId=${spaceId}` : AppRoutes.spaces.billing

export const getModalContent = (plan: PlanStatus, spaceId: string | null): ModalContent => {
  if (!plan.belongsToWorkspace) {
    return {
      cta: { label: 'Create a Workspace', href: AppRoutes.spaces.createSpace },
      showSafesSelector: false,
      showPaygFootnote: false,
    }
  }

  const billing = billingHref(spaceId)
  const isPro = plan.planName !== 'Starter'
  const base = { showSafesSelector: isPro, showPaygFootnote: isPro }

  if (plan.planName === 'Starter') {
    if (plan.status === 'limit_reached') {
      return {
        ...base,
        cta: { label: 'Upgrade to Pro', href: billing },
        comparison: { activeTierId: STARTER_TIER.id, tiers: [STARTER_TIER, PRO_TIER] },
      }
    }
    return { ...base, cta: { label: 'Compare plans', href: billing } }
  }

  if (plan.status === 'approaching_limit') {
    return {
      ...base,
      cta: { label: 'Upgrade to Pro+', href: billing },
      comparison: { activeTierId: PRO_TIER.id, tiers: [PRO_TIER, PRO_PLUS_TIER] },
    }
  }

  if (plan.status === 'payment_failed') {
    return { ...base, cta: { label: 'Update payment method', href: billing } }
  }

  return { ...base, cta: { label: 'Manage plan', href: billing } }
}
