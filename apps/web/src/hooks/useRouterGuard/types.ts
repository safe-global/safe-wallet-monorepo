// ---------------------------------------------------------------------------
// Guard helpers
// ---------------------------------------------------------------------------

import type { ParsedUrlQuery } from '@/storybook/mocks/querystring'

export interface GuardResult {
  success: boolean
  redirectTo?: string
}

// ---------------------------------------------------------------------------
// Guard context — all derived state the rules need to make decisions
// ---------------------------------------------------------------------------

export interface GuardContext {
  pathname: string
  query: ParsedUrlQuery
  isPublicRoute: boolean
  isOnboardingRoute: boolean
  isSpacesPath: boolean
  isLoginPath: boolean
  isStoreHydrated: boolean
  isWalletReady: boolean
  isSiweAuthenticated: boolean
  hasSpaces: boolean
  isPartOfSpaceUrl: boolean
  isRequireLoginEnabled: boolean | undefined
  currentUrl: string
}

// ---------------------------------------------------------------------------
// Guard rules — evaluated in order, first match wins
// ---------------------------------------------------------------------------

export interface GuardRule {
  match: (ctx: GuardContext) => boolean
  action: (ctx: GuardContext) => GuardResult
}
