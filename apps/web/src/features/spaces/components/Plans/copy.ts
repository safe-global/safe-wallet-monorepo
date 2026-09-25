import { formatDate } from '@safe-global/utils/utils/date'
import type { WorkspaceLockReason } from '../../hooks/useWorkspaceLock'
import type { PlanTier } from './types'

export const TRIAL_DISCLAIMER =
  "Your paid subscription only starts after you add billing details. If you don't add them before your free access ends, your Workspace will be locked. Your Safe accounts remain available outside the Workspace."

// The CGW grants the 60-day grace only to Workspaces that predate enforcement; anything else is a new Workspace.
const MIGRATED_TRIAL_DAYS = 60

/** `existing` locks a Workspace that predates Safe Pro; `new` greets one the wizard just created. */
export type ClaimTrialVariant = 'existing' | 'new'

export type ClaimTrialCopy = { title: string; subtitle: string; note: string; back: string; claim: string }

export const claimCopy = (trialPeriodDays: number | null, variant: ClaimTrialVariant = 'existing'): ClaimTrialCopy => {
  if (variant === 'new') {
    return {
      title: 'Workspaces run on Safe Pro',
      subtitle: trialPeriodDays === null ? 'Your first days are free.' : `Your first ${trialPeriodDays} days are free.`,
      note: "No payment method required. We'll remind you 7 days before your free access ends.",
      back: 'Go to My accounts',
      claim: 'Claim free access',
    }
  }
  const existing = {
    note: "No payment method required. We'll remind you 7 days before your free access ends.",
    back: 'Go to My accounts',
    claim: 'Claim free access',
  }
  return trialPeriodDays === MIGRATED_TRIAL_DAYS
    ? {
        ...existing,
        title: 'Your Workspace moved to Safe Pro on Oct 6, 2026',
        subtitle: 'You’ve used Safe before, so your free access is 60 days instead of 30.',
      }
    : {
        ...existing,
        title:
          trialPeriodDays === null
            ? 'Start your free access to Safe Pro'
            : `Start your ${trialPeriodDays}-day free access to Safe Pro`,
        subtitle: 'All Pro features unlocked. No billing details needed upfront.',
      }
}

const maxSeats = (tier: PlanTier): number => Math.max(0, ...tier.options.map((option) => option.seats ?? 0))

/** "Need more than 20?" under the tier with the most seats, pointing to sales. */
export const salesHintFor = (tiers: PlanTier[]) => {
  const largest = tiers.reduce<PlanTier | undefined>(
    (best, tier) => (!best || maxSeats(tier) > maxSeats(best) ? tier : best),
    undefined,
  )
  return (tier: PlanTier) =>
    largest && tier.name === largest.name && maxSeats(tier) > 0 ? `Need more than ${maxSeats(tier)}?` : undefined
}

export const chooserCopy = (
  reason: Exclude<WorkspaceLockReason, 'trial-offered'>,
  endedAt: number | null,
): { title: string; subtitle: string } => {
  if (reason === 'payment-failed') {
    return {
      title: 'Your last payment failed',
      subtitle: 'Update your billing details to keep using your Workspace, everything is exactly as you left it.',
    }
  }
  return endedAt === null
    ? {
        title: 'Your Workspace has no active plan',
        subtitle: 'Choose a plan to keep using your Workspace, everything is exactly as you left it.',
      }
    : {
        title: `Your Safe Pro free access ended on ${formatDate(endedAt)}`,
        subtitle: 'Choose a plan to unlock your Workspace.',
      }
}
