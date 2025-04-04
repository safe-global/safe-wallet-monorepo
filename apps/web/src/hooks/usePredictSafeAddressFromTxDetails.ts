import type { DataDecoded, TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'

import { predictSafeAddress } from '@/features/multichain/utils/utils'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useWeb3ReadOnly } from './wallets/web3'

export function _getSetupFromDataDecoded(dataDecoded: DataDecoded) {
  if (dataDecoded?.method !== 'createProxyWithNonce') {
    return
  }

  const singleton = dataDecoded?.parameters?.[0]?.value
  const initializer = dataDecoded?.parameters?.[1]?.value
  const saltNonce = dataDecoded?.parameters?.[2]?.value

  if (typeof singleton !== 'string' || typeof initializer !== 'string' || typeof saltNonce !== 'string') {
    return
  }

  return {
    singleton,
    initializer,
    saltNonce,
  }
}

function isCreateProxyWithNonce(dataDecoded?: DataDecoded) {
  return dataDecoded?.method === 'createProxyWithNonce'
}

export function usePredictSafeAddressFromTxDetails(txDetails: TransactionDetails | undefined) {
  const web3 = useWeb3ReadOnly()

  return useAsync(() => {
    const txData = txDetails?.txData
    if (!web3 || !txData) {
      return
    }

    const isMultiSend = txData?.dataDecoded?.method === 'multiSend'

    const dataDecoded = isMultiSend
      ? txData?.dataDecoded?.parameters?.[0]?.valueDecoded?.find((tx) => isCreateProxyWithNonce(tx?.dataDecoded))
          ?.dataDecoded
      : txData?.dataDecoded
    const factoryAddress = isMultiSend
      ? txData?.dataDecoded?.parameters?.[0]?.valueDecoded?.find((tx) => isCreateProxyWithNonce(tx?.dataDecoded))?.to
      : txData?.to?.value

    if (!dataDecoded || !isCreateProxyWithNonce(dataDecoded) || !factoryAddress) {
      return
    }

    const setup = _getSetupFromDataDecoded(dataDecoded)
    if (!setup) {
      return
    }

    return predictSafeAddress(setup, factoryAddress, web3)
  }, [txDetails?.txData, web3])
}
