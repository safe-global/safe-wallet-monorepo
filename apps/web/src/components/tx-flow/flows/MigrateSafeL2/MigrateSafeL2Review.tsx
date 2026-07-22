import { useContext, useEffect } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import { createMigrateToL2 } from '@/utils/safe-migrations'
import { Box, Typography } from '@mui/material'
import ErrorMessage from '@/components/tx/ErrorMessage'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'

export const MigrateSafeL2Review = ({ children, ...props }: ReviewTransactionProps) => {
  const chain = useCurrentChain()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const safeSDK = useSafeSDK()

  useEffect(() => {
    if (!chain || !safeSDK) return

    const txData = createMigrateToL2()
    createTx(txData).then(setSafeTx).catch(setSafeTxError)
  }, [chain, setSafeTx, setSafeTxError, safeSDK])

  return (
    <Box>
      <ReviewTransaction {...props}>
        <ErrorMessage level="warning" title="Migration transaction">
          <Typography>
            The migration may take a few minutes. Transactions made before or during the migration won&apos;t show up in
            your transaction history, but all future transactions will appear as usual.
          </Typography>
        </ErrorMessage>

        {children}
      </ReviewTransaction>
    </Box>
  )
}
