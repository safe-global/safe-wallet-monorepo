import { skipToken } from '@reduxjs/toolkit/query'
import { POLICY_GUARD_DELAY_SECONDS } from '@safe-global/utils/features/policy-guard/constants'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { getPolicyGuardAddress, getPolicyGuardDelay } from '../services/policyEngineDeployments'
import { useGetGuardDelayQuery } from '../store/guardDelayApi'

/** The delay of `guardAddress`, or of the guard the setup installs, read from the chain; the deployment's known delay until then */
export const usePolicyGuardDelay = (chainId: string, guardAddress?: string): number => {
  const customRpc = useAppSelector(selectRpc)[chainId]
  const address = guardAddress || getPolicyGuardAddress(chainId)
  const { currentData } = useGetGuardDelayQuery(address ? { chainId, guardAddress: address, customRpc } : skipToken)

  return currentData ?? getPolicyGuardDelay(chainId, address) ?? POLICY_GUARD_DELAY_SECONDS
}
