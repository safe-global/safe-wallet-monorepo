import { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useCurrentChain } from './useChains'
import { useWeb3ReadOnly } from './wallets/web3'
import { useDefaultGasPrice, type GasFeeParams } from '@safe-global/utils/hooks/useDefaultGasPrice'

const useGasPrice = (isSpeedUp: boolean = false): AsyncResult<GasFeeParams> => {
  const chain = useCurrentChain()
  const provider = useWeb3ReadOnly()

  const [gasPrice, gasPriceError, gasPriceLoading] = useDefaultGasPrice(chain, provider, {
    isSpeedUp,
    withPooling: true,
    logError: (e) => {
      console.error(e)
    },
  })

  return [gasPrice, gasPriceError, gasPriceLoading]
}

export default useGasPrice
