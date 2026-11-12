import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { TOKEN_LISTS } from '@/store/settingsSlice'

/** The `trusted` value balance requests on `chain` send; CGW keys its Zerion snapshot by it, so all must agree. */
export const isTrustedTokenList = (chain: Chain, tokenList: TOKEN_LISTS | undefined): boolean =>
  hasFeature(chain, FEATURES.PORTFOLIO_ENDPOINT) &&
  tokenList !== TOKEN_LISTS.ALL &&
  hasFeature(chain, FEATURES.DEFAULT_TOKENLIST)
