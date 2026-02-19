import { GuardContext, GuardResult, GuardRule } from './types'

export const allow = (): GuardResult => ({ success: true })
export const redirect = (redirectTo: string): GuardResult => ({ success: false, redirectTo })

/**
 * Runs the guard rules against the given context.
 * Returns the result of the first matching rule, or `allow()` if none match.
 */
export const evaluateGuard = (ctx: GuardContext, guardRules: GuardRule[]): GuardResult => {
  for (const rule of guardRules) {
    if (rule.match(ctx)) {
      return rule.action(ctx)
    }
  }
  return allow()
}
