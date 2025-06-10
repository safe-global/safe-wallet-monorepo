import type { FiatCurrencies } from '@safe-global/store/gateway/types'
import { useBalancesGetSupportedFiatCodesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

const useCurrencies = (): FiatCurrencies | undefined => {
  const { data } = useBalancesGetSupportedFiatCodesV1Query()

  return data
}

export default useCurrencies
