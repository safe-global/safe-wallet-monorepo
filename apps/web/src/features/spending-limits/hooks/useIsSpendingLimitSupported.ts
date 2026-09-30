import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import {
  getDeployedSpendingLimitModuleAddress,
  getLatestSpendingLimitAddress,
} from '../services/spendingLimitDeployments'

/**
 * Whether a new spending limit can be created on the current chain.
 *
 * Returns true when the AllowanceModule is already enabled on the Safe (resolvable
 * via the CREATE2 fallback), or when a deployment address is registered for the chain
 * so the module can be enabled. Otherwise the module cannot be used here and the flow
 * would otherwise stall — the config-service feature flag can be on for a chain the
 * deployment package doesn't cover yet.
 */
const useIsSpendingLimitSupported = (): boolean => {
  const chainId = useChainId()
  const { safe } = useSafeInfo()

  const alreadyEnabled = safe.deployed && !!getDeployedSpendingLimitModuleAddress(chainId, safe.modules)
  const canEnable = !!getLatestSpendingLimitAddress(chainId)

  return alreadyEnabled || canEnable
}

export default useIsSpendingLimitSupported
