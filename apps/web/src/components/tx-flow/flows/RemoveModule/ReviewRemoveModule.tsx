import { Typography } from '@mui/material'
import { useCallback, useContext, useEffect, type PropsWithChildren } from 'react'
import { Errors, logError } from '@/services/exceptions'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { createRemoveModuleTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { type RemoveModuleFlowProps } from '.'
import EthHashInfo from '@/components/common/EthHashInfo'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'

export const ReviewRemoveModule = ({
  params,
  onSubmit,
  children,
}: PropsWithChildren<{ params: RemoveModuleFlowProps; onSubmit: () => void }>) => {
  const { setSafeTx, safeTxError, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    createRemoveModuleTx(params.address).then(setSafeTx).catch(setSafeTxError)
  }, [params.address, setSafeTx, setSafeTxError])

  useEffect(() => {
    if (safeTxError) {
      logError(Errors._806, safeTxError.message)
    }
  }, [safeTxError])

  const onFormSubmit = useCallback(() => {
    trackEvent(SETTINGS_EVENTS.MODULES.REMOVE_MODULE)
    onSubmit()
  }, [onSubmit])

  return (
    <ReviewTransaction onSubmit={onFormSubmit}>
      <Typography color="primary.light">Module</Typography>

      <EthHashInfo address={params.address} showCopyButton hasExplorer shortAddress={false} />

      <Typography my={2}>
        After removing this module, any feature or app that uses this module might no longer work. If this Safe Account
        requires more then one signature, the module removal will have to be confirmed by other signers as well.
      </Typography>

      {children}
    </ReviewTransaction>
  )
}
