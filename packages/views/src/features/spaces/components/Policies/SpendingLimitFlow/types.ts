export type LimitFormValues = {
  /** Token address; `ZERO_ADDRESS` for the native currency; `''` until picked. */
  tokenAddress: string
  /** Human-readable amount as typed; decimals come from the token when building the tx. */
  amount: string
  /** Reset period in MINUTES as a string — what `setAllowance` stores. `'0'` = one time.
      Recovery stores seconds, so never share a helper with it. */
  resetTime: string
}

export type SpenderFormValues = {
  address: string
  limits: LimitFormValues[]
}

export type SpendingLimitPolicyFormValues = {
  /** `${chainId}:${address}` — both the `SafeAccountSelector` id and the `SafeScopeKey` format. */
  safe: string
  spenders: SpenderFormValues[]
}

/** One time is the least permissive period, and the Safe-level flow's default. */
export const DEFAULT_RESET_TIME = '0'

export const createEmptyLimit = (): LimitFormValues => ({ tokenAddress: '', amount: '', resetTime: DEFAULT_RESET_TIME })

export const createEmptySpender = (): SpenderFormValues => ({ address: '', limits: [createEmptyLimit()] })

export const createDefaultFormValues = (): SpendingLimitPolicyFormValues => ({
  safe: '',
  spenders: [createEmptySpender()],
})

export const spenderAddressPath = (spenderIndex: number) => `spenders.${spenderIndex}.address` as const

export const limitsPath = (spenderIndex: number) => `spenders.${spenderIndex}.limits` as const

export const limitPath = <F extends keyof LimitFormValues>(spenderIndex: number, limitIndex: number, field: F) =>
  `spenders.${spenderIndex}.limits.${limitIndex}.${field}` as const

export type RemovalCopy = { title: string; description: string }

export type TokenOptionGroup = 'held' | 'popular'

/** One selectable token. `group` decides which section it renders in and whether a balance is shown. */
export type TokenOption = {
  /** `ZERO_ADDRESS` for the native currency. */
  address: string
  symbol: string
  name: string
  decimals: number
  logoUri?: string
  group: TokenOptionGroup
  /** Raw units; held tokens only. */
  balance?: string
  /** Held tokens only. */
  fiatBalance?: string
  /** Held tokens only: the fiat price of one whole token. */
  fiatConversion?: string
}
