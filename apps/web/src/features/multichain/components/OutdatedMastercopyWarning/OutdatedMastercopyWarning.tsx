import { TxModalContext } from '@/components/tx-flow'
import { UpdateSafeFlow } from '@/components/tx-flow/flows'
import { ActionCard } from '@/components/common/ActionCard'
import useSafeInfo from '@/hooks/useSafeInfo'
import { MasterCopyDeployer, useMasterCopies } from '@/hooks/useMasterCopies'
import { useCurrentChain } from '@/hooks/useChains'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useCallback, useContext, useMemo } from 'react'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import { getLatestSafeVersion, isNonCriticalUpdate } from '@safe-global/utils/utils/chains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ATTENTION_PANEL_EVENTS } from '@/services/analytics/events/attention-panel'

export const OutdatedMastercopyWarning = () => {
  const { safe } = useSafeInfo()
  const [masterCopies] = useMasterCopies()
  const currentChain = useCurrentChain()
  const isOwner = useIsSafeOwner()
  const { setTxFlow } = useContext(TxModalContext)
  const openUpdateModal = useCallback(() => setTxFlow(<UpdateSafeFlow />), [setTxFlow])

  const safeMasterCopy = useMemo(() => {
    return masterCopies?.find((mc) => sameAddress(mc.address, safe.implementation.value))
  }, [masterCopies, safe.implementation.value])

  if (safe.implementationVersionState !== ImplementationVersionState.OUTDATED) return null
  if (isNonCriticalUpdate(safe.version)) return null
  if (safeMasterCopy?.deployer !== MasterCopyDeployer.GNOSIS) return null

  const latestSafeVersion = getLatestSafeVersion(currentChain)

  return (
    <ActionCard
      severity="info"
      title={`New Safe version is available - ${latestSafeVersion}. `}
      content="Update now to take advantage of new features and the highest security standards available. You will need to confirm this update just like any other transaction."
      action={isOwner ? { label: 'Update', onClick: openUpdateModal } : undefined}
      trackingEvent={ATTENTION_PANEL_EVENTS.UPDATE_OUTDATED_MASTERCOPY}
    />
  )
}
