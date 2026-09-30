import type { SpendingLimitPolicyFormValues } from '../types'

export type FilledLimit = { address: string; tokenAddress: string; amount: string; resetTime: string }

/**
 * The form's complete rows. A row still being typed describes no limit yet, so it neither keeps nor
 * removes one — a rule worth stating once, since every comparison against the chain depends on it.
 */
export const filledLimits = (values: SpendingLimitPolicyFormValues): FilledLimit[] =>
  values.spenders
    .filter((spender) => spender.address)
    .flatMap((spender) =>
      spender.limits
        .filter((limit) => limit.tokenAddress)
        .map((limit) => ({
          address: spender.address,
          tokenAddress: limit.tokenAddress,
          amount: limit.amount,
          resetTime: limit.resetTime,
        })),
    )
