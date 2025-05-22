import { useEffect } from 'react'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import { initSafeSDK, setSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { useWeb3ReadOnly } from '@/src/hooks/wallets/web3'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import Logger from '@/src/utils/logger'

export const useInitSafeCoreSDK = () => {
  const { safe, safeLoaded } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()

  useEffect(() => {
    if (!safeLoaded || !web3ReadOnly) {
      // If we don't reset the SDK, a previous Safe could remain in the store
      setSafeSDK(undefined)
      return
    }

    // Read-only for now
    initSafeSDK({
      provider: web3ReadOnly,
      chainId: safe.chainId,
      address: safe.address.value,
      version: safe.version,
      implementationVersionState: safe.implementationVersionState,
      implementation: safe.implementation.value,
    })
      .then(setSafeSDK)
      .catch((_e) => {
        const e = asError(_e)
        Logger.error('error init', e)
      })
  }, [
    safe?.address?.value,
    safe?.chainId,
    safe?.implementation?.value,
    safe?.implementationVersionState,
    safe?.version,
    safeLoaded,
    web3ReadOnly,
  ])
}
