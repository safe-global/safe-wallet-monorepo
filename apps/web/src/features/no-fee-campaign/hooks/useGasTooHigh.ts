import useGasLimit from '@/hooks/useGasLimit'
import { MAX_GAS_LIMIT_NO_FEE_CAMPAIGN } from '../constants'
import { useIsNoFeeCampaignEnabled } from './useIsNoFeeCampaignEnabled'
import type { SafeTransaction } from '@safe-global/types-kit'

export function useGasTooHigh(safeTx?: SafeTransaction): boolean | undefined {
  const { gasLimit } = useGasLimit(safeTx)
  const isNoFeeCampaignEnabled = useIsNoFeeCampaignEnabled()

  // The 1M gas cap only applies to the No-Fee campaign. On other RELAYING chains it must not gate relay availability
  if (!isNoFeeCampaignEnabled) {
    return false
  }

  // Check if gas limit exceeds maximum allowed for No Fee November
  if (gasLimit && BigInt(gasLimit) > MAX_GAS_LIMIT_NO_FEE_CAMPAIGN) {
    return true
  }

  return false
}
