import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import semverSatisfies from 'semver/functions/satisfies'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useQueuedTxsLength } from '@/hooks/useTxQueue'
import madProps from '@/utils/mad-props'
import { extractTargetVersionFromUpdateSafeTx } from '@/services/tx/safeUpdateParams'
import { UpdateSafeView } from '@views/components/tx/confirmation-views/UpdateSafe/UpdateSafeView'

const QUEUE_WARNING_VERSION = '<1.3.0'

export function _UpdateSafe({
  safeInfo,
  queueSize,
  chain,
  txData,
}: {
  safeInfo: ReturnType<typeof useSafeInfo>
  queueSize: string
  chain: ReturnType<typeof useCurrentChain>
  txData: TransactionData | undefined
}) {
  const { safe } = safeInfo
  if (!safe.version) {
    return null
  }
  const showQueueWarning = queueSize && semverSatisfies(safe.version, QUEUE_WARNING_VERSION)
  const newVersion = extractTargetVersionFromUpdateSafeTx(txData, safe)

  return (
    <UpdateSafeView
      currentVersion={safe.version}
      newVersion={newVersion}
      isL2={chain?.l2}
      showQueueWarning={showQueueWarning}
      queueSize={queueSize}
    />
  )
}

const UpdateSafe = madProps(_UpdateSafe, {
  chain: useCurrentChain,
  safeInfo: useSafeInfo,
  queueSize: useQueuedTxsLength,
})

export default UpdateSafe
