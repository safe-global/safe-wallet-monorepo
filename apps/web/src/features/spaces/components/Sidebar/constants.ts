export const SPACE_SELECTOR_NAME_MAX_LENGTH = 15

const safeAccountsLimitRaw = Number.parseInt(process.env.NEXT_PUBLIC_SPACES_SAFE_ACCOUNTS_LIMIT ?? '', 10)
export const SAFE_ACCOUNTS_LIMIT = !Number.isNaN(safeAccountsLimitRaw) ? safeAccountsLimitRaw : 40
