import { useContext } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { createUpdateSafeTxs } from '@/services/tx/safeUpdateParams'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import useAsync from '@safe-global/utils/hooks/useAsync'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import useIsUpgradeableMasterCopy from '@/hooks/useIsUpgradeableMasterCopy'

export const UpdateSafeReview = (props: ReviewTransactionProps) => {
  const { safe, safeLoaded } = useSafeInfo()
  const chain = useCurrentChain()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { version: upgradeableMasterCopyVersion } = useIsUpgradeableMasterCopy()

  useAsync(async () => {
    if (!chain || !safeLoaded) return

    const resolvedVersion = safe.version ?? upgradeableMasterCopyVersion

    if (!resolvedVersion) return

    const txs = await createUpdateSafeTxs(safe, chain, {
      fallbackSafeVersion: upgradeableMasterCopyVersion,
    })
    const safeTxPromise = txs.length > 1 ? createMultiSendCallOnlyTx(txs) : createTx(txs[0])

    safeTxPromise.then(setSafeTx).catch(setSafeTxError)
  }, [safe, safeLoaded, chain, setSafeTx, setSafeTxError, upgradeableMasterCopyVersion])

  return <ReviewTransaction {...props} />
}
