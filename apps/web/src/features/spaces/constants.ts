import { getQuotaExceededError } from '@safe-global/utils/services/quotaErrors'
import type { SafeLimit } from '@/utils/spaces'

const safeAccountsLimitRaw = Number.parseInt(process.env.NEXT_PUBLIC_SPACES_SAFE_ACCOUNTS_LIMIT ?? '', 10)

/**
 * Maximum number of Safe accounts a single workspace can hold. This is a spaces
 * domain rule, not sidebar config — import it from the spaces feature root.
 *
 * Note: the backend enforces the real limit but does not expose it, so this
 * client-side value can silently drift from the server's. Keep them in sync.
 */
export const SAFE_ACCOUNTS_LIMIT = !Number.isNaN(safeAccountsLimitRaw) ? safeAccountsLimitRaw : 40

/** Maximum number of workspaces a user can have. A spaces domain rule — import it from here, not from sidebar config. */
export const SPACES_LIMIT = 10

/** Maximum length of a workspace name. Enforced on both create and rename. */
export { SPACE_NAME_MAX_LENGTH } from '@safe-global/utils/validation/names'

/** The CGW refused to add Safes because the plan's seats are spent; undefined for any other error. */
export const getSeatLimitMessage = (error: unknown): string | undefined => {
  const quota = getQuotaExceededError(error)
  if (!quota || quota.feature !== 'safe_seats') return undefined
  return `Your plan covers ${quota.quota} Safe accounts and this Workspace already holds ${quota.used}. Remove one to add another, or upgrade your plan.`
}

/** A counterfactual Safe was kept in My accounts because the Workspace has no seat left. */
export const seatLimitSkippedMessage = (limit: SafeLimit): string => {
  const seats = typeof limit === 'number' ? `limit of ${limit} Safe accounts` : 'seat limit'
  return `Safe created in My accounts. The Workspace is at its ${seats}, so it wasn't added there.`
}

/** Notice before creating a Safe that stays out of a full Workspace; `outcome` names what happens to it. */
export const seatLimitNotice = (limit: SafeLimit, outcome: string): string =>
  `This Workspace is at its limit of ${limit} Safe accounts. ${outcome} in My accounts, outside the Workspace.`

export const seatsTooltip = (tierName: string | undefined, quota: number | null | undefined) =>
  `${tierName ?? 'Your plan'} covers ${quota ?? 'unlimited'} Safe accounts. At ${quota ?? 'unlimited'}, remove one from this Workspace to add another. Safe accounts you leave out remain available in My accounts.`

/** Tooltip on the step that trims a Workspace down to the plan's seats. */
export const selectSeatsTooltip = (planName: string, limit: number): string =>
  `${planName} covers ${limit} Safe accounts. Safe accounts you leave out remain available outside the Workspace. You can swap them in any time.`

export const safeLimitTooltip = (limit: SafeLimit): string => {
  if (limit === undefined) return "Your plan's Safe account limit isn't available yet"
  if (limit === null) return 'Your plan has no limit on Safe accounts per Workspace'
  return `You can add up to ${limit} Safe accounts per Workspace`
}
