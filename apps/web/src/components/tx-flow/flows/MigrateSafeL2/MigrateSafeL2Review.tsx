import { useContext, useEffect } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import { createUpdateMigration } from '@/utils/safe-migrations'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { MigrateSafeL2ReviewView } from '@views/components/tx-flow/flows/MigrateSafeL2/MigrateSafeL2ReviewView'

export const MigrateSafeL2Review = ({ children, ...props }: ReviewTransactionProps) => {
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const safeSDK = useSafeSDK()

  useEffect(() => {
    if (!chain || !safeSDK) return

    const txData = createUpdateMigration(chain, safe.version, safe.fallbackHandler?.value, safe.implementation?.value)
    createTx(txData).then(setSafeTx).catch(setSafeTxError)
  }, [chain, safe.version, safe.fallbackHandler?.value, safe.implementation?.value, setSafeTx, setSafeTxError, safeSDK])

  return (
    <ReviewTransaction {...props}>
      <MigrateSafeL2ReviewView />

      {children}
    </ReviewTransaction>
  )
}
