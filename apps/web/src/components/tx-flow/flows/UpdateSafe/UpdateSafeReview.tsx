import { useContext } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { createUpdateSafeTxs } from '@/services/tx/safeUpdateParams'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'

export const UpdateSafeReview = (props: ReviewTransactionProps) => {
  const { safe, safeLoaded } = useSafeInfo()
  const chain = useCurrentChain()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useAsync(async () => {
    if (!chain || !safeLoaded) return

    // Route every failure to setSafeTxError — an uncaught throw here would leave the
    // review screen on its loading spinner forever.
    try {
      const txs = await createUpdateSafeTxs(safe, chain)
      const safeTx = await (txs.length > 1 ? createMultiSendCallOnlyTx(txs) : createTx(txs[0]))
      setSafeTx(safeTx)
    } catch (error) {
      setSafeTxError(asError(error))
    }
  }, [safe, safeLoaded, chain, setSafeTx, setSafeTxError])

  return <ReviewTransaction {...props} />
}
