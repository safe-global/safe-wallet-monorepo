import type { ParsedUrlQuery } from '@/storybook/mocks/querystring'

export interface GuardResult {
  success: boolean
  redirectTo?: string
}

// Derived state the rules read to make decisions.
export interface GuardContext {
  pathname: string
  query: ParsedUrlQuery
  isPublicRoute: boolean
  isOnboardingRoute: boolean
  isSpacesPath: boolean
  isStoreHydrated: boolean
  isWalletReady: boolean
  isSiweAuthenticated: boolean
  hasSpaces: boolean
  isPartOfSpaceUrl: boolean
}

// Guard rules — evaluated in order, first match wins.

export interface GuardRule {
  match: (ctx: GuardContext) => boolean
  action: (ctx: GuardContext) => GuardResult
}
