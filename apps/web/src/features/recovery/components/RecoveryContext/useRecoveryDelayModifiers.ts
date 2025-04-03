import type { Delay } from '@gnosis.pm/zodiac'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

import { getRecoveryDelayModifiers } from '@/features/recovery/services/delay-modifier'
import useAsync from '@/hooks/useAsync'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { getDeployedSpendingLimitModuleAddress } from '@/services/contracts/spendingLimitContracts'
import type { AsyncResult } from '@/hooks/useAsync'
import { useIsRecoverySupported } from '../../hooks/useIsRecoverySupported'

function isOnlySpendingLimitEnabled(chainId: string, modules: SafeState['modules']) {
  if (modules && modules.length > 1) return false
  const spendingLimit = getDeployedSpendingLimitModuleAddress(chainId, modules)
  return !!spendingLimit
}

export function useRecoveryDelayModifiers(): AsyncResult<Delay[]> {
  const supportsRecovery = useIsRecoverySupported()
  const web3ReadOnly = useWeb3ReadOnly()
  const { safe, safeAddress } = useSafeInfo()

  return useAsync<Array<Delay>>(
    () => {
      // Don't fetch if only spending limit module is enabled
      if (
        supportsRecovery &&
        web3ReadOnly &&
        safe.modules &&
        safe.modules.length > 0 &&
        !isOnlySpendingLimitEnabled(safe.chainId, safe.modules)
      ) {
        return getRecoveryDelayModifiers(safe.chainId, safe.modules, web3ReadOnly)
      }
    },
    // Only fetch delay modifiers again if the chain or enabled modules of current Safe changes
    // Need to check length of modules array to prevent new request every time Safe info polls
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safeAddress, safe.chainId, safe.modules?.length, web3ReadOnly, supportsRecovery],
    false,
  )
}
