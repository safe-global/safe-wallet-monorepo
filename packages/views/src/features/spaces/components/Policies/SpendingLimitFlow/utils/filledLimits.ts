import type { SpendingLimitPolicyFormValues } from '../types'

/** One complete row of the form, lifted out of its spender card. */
export type FilledLimit = { address: string; tokenAddress: string; amount: string; resetTime: string }

/**
 * @returns The form's complete rows, flattened. A row still being typed describes no limit yet, so
 *   it neither keeps nor removes one — every comparison against the chain depends on that rule.
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
