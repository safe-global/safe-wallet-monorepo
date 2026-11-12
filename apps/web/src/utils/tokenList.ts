import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { TOKEN_LISTS } from '@/store/settingsSlice'

/**
 * The `trusted` value balance requests on `chain` send for the user's token list setting.
 * CGW keys its cached Zerion snapshot by this value, so every request for the same Safe must agree on it.
 */
export const isTrustedTokenList = (chain: Chain, tokenList: TOKEN_LISTS | undefined): boolean =>
  hasFeature(chain, FEATURES.PORTFOLIO_ENDPOINT) &&
  tokenList !== TOKEN_LISTS.ALL &&
  hasFeature(chain, FEATURES.DEFAULT_TOKENLIST)
