import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

export type ChainInfo = Pick<Chain, 'chainId' | 'chainName' | 'chainLogoUri' | 'shortName'>
