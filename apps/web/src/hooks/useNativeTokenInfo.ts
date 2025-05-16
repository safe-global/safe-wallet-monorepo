import { type NativeToken } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useCurrentChain } from './useChains'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'

export const useNativeTokenInfo = (): NativeToken => {
  const chain = useCurrentChain()

  return {
    type: 'NATIVE_TOKEN',
    address: ZERO_ADDRESS,
    symbol: chain?.nativeCurrency.symbol ?? 'ETH',
    decimals: chain?.nativeCurrency.decimals ?? 18,
    logoUri: chain?.nativeCurrency.logoUri ?? '',
    name: chain?.nativeCurrency.name ?? 'Ether',
  }
}
