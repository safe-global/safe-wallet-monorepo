import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'

import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from '@/hooks/useSafeInfo'
import { DelegateCallModule } from '@safe-global/utils/services/security/modules/DelegateCallModule'
import type { DelegateCallModuleResponse } from '@safe-global/utils/services/security/modules/DelegateCallModule'
import type { SecurityResponse } from '@safe-global/utils/services/security/modules/types'
import { useCurrentChain } from '@/hooks/useChains'

const DelegateCallModuleInstance = new DelegateCallModule()

// TODO: Not being used right now
export const useDelegateCallModule = (safeTransaction: SafeTransaction | undefined) => {
  const { safe, safeLoaded } = useSafeInfo()
  const currentChain = useCurrentChain()

  return useAsync<SecurityResponse<DelegateCallModuleResponse>>(() => {
    if (!safeTransaction || !safeLoaded || !currentChain) {
      return
    }

    return DelegateCallModuleInstance.scanTransaction({
      safeTransaction,
      safeVersion: safe.version,
      chain: currentChain,
    })
  }, [safeTransaction, safeLoaded, safe.version, currentChain])
}
