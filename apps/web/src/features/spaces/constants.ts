const safeAccountsLimitRaw = Number.parseInt(process.env.NEXT_PUBLIC_SPACES_SAFE_ACCOUNTS_LIMIT ?? '', 10)

/**
 * Maximum number of Safe accounts a single workspace can hold. This is a spaces
 * domain rule, not sidebar config — import it from the spaces feature root.
 *
 * Note: the backend enforces the real limit but does not expose it, so this
 * client-side value can silently drift from the server's. Keep them in sync.
 */
export const SAFE_ACCOUNTS_LIMIT = !Number.isNaN(safeAccountsLimitRaw) ? safeAccountsLimitRaw : 40

export const SPACES_LIMIT = 10

/** Maximum length of a workspace name. Enforced on both create and rename. */
export { SPACE_NAME_MAX_LENGTH } from '@safe-global/utils/validation/names'

/** Friendly notice shown when a workspace is already at the Safe accounts cap. */
export const safeAccountsLimitReachedText = (limit: number = SAFE_ACCOUNTS_LIMIT) =>
  `You've reached the maximum of ${limit} Safe accounts per workspace`
