import { useContext, useEffect } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import { createMigrateToL2 } from '@/utils/safe-migrations'
import { Box, Typography } from '@mui/material'
import ErrorMessage from '@/components/tx/ErrorMessage'
import ReviewTransaction from '@/components/tx/ReviewTransaction'

export const MigrateSafeL2Review = ({ onSubmit }: { onSubmit: () => void }) => {
  const chain = useCurrentChain()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    if (!chain) return

    const txData = createMigrateToL2(chain)
    createTx(txData).then(setSafeTx).catch(setSafeTxError)
  }, [chain, setSafeTx, setSafeTxError])

  return (
    <Box>
      <ReviewTransaction onSubmit={onSubmit}>
        <ErrorMessage level="warning" title="Migration transaction">
          <Typography>
            When executing this transaction, it will not get indexed and appear in the history due to the current
            incompatible base contract. It might also take a few minutes until the new Safe Account version and nonce
            are reflected in the interface. After the migration is complete, future transactions will get processed and
            indexed as usual, and there will be no further restrictions.
          </Typography>
        </ErrorMessage>
      </ReviewTransaction>
    </Box>
  )
}
