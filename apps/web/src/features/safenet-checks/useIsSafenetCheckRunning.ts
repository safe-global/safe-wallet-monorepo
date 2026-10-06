import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useFlowSafenetCheck } from './useFlowSafenetCheck'

/** A check exists for the open transaction and has no result yet. False before the first signature. */
export const useIsSafenetCheckRunning = (enabled: boolean): boolean => {
  const { publicStatus } = useFlowSafenetCheck(enabled).check
  return enabled && (publicStatus === CheckStatus.SUBMITTED || publicStatus === CheckStatus.IN_PROGRESS)
}
