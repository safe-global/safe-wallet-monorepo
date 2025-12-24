import { useCallback, useContext, useEffect, type PropsWithChildren } from 'react'
import { Typography } from '@mui/material'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Errors, logError } from '@/services/exceptions'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { createRemoveGuardTx } from '@/services/tx/tx-sender'
import { type RemoveGuardFlowProps } from '.'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'

export const ReviewRemoveGuard = ({
  params,
  onSubmit,
  children,
}: PropsWithChildren<{ params: RemoveGuardFlowProps; onSubmit: () => void }>) => {
  const { setSafeTx, safeTxError, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    createRemoveGuardTx().then(setSafeTx).catch(setSafeTxError)
  }, [setSafeTx, setSafeTxError])

  useEffect(() => {
    if (safeTxError) {
      logError(Errors._807, safeTxError.message)
    }
  }, [safeTxError])

  const onFormSubmit = useCallback(() => {
    trackEvent(SETTINGS_EVENTS.MODULES.REMOVE_GUARD)
    onSubmit()
  }, [onSubmit])

  return (
    <ReviewTransaction onSubmit={onFormSubmit}>
      <Typography color="primary.light">Transaction guard</Typography>

      <EthHashInfo address={params.address} showCopyButton hasExplorer shortAddress={false} />

      <Typography my={2}>
        Once the transaction guard has been removed, checks by the transaction guard will not be conducted before or
        after any subsequent transactions.
      </Typography>

      {children}
    </ReviewTransaction>
  )
}
