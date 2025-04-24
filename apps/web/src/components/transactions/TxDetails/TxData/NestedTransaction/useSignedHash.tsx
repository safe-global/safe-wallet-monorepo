import { Safe__factory } from '@safe-global/utils/types/contracts'
import { type TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import { useMemo } from 'react'

const safeInterface = Safe__factory.createInterface()

export const useSignedHash = (txData?: TransactionData) => {
  const signedHash = useMemo(() => {
    const params = txData?.hexData ? safeInterface.decodeFunctionData('approveHash', txData?.hexData) : undefined
    if (!params || params.length !== 1 || typeof params[0] !== 'string') {
      return
    }

    return params[0]
  }, [txData?.hexData])

  return signedHash
}
