import { Grid, Typography } from '@mui/material'
import { useCallback, useContext, useEffect } from 'react'
import { Errors, logError } from '@/services/exceptions'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { createRemoveModuleTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { type RemoveModuleFlowProps } from '.'
import EthHashInfo from '@/components/common/EthHashInfo'
import ReviewTransaction from '@/components/tx/ReviewTransaction'

export const ReviewRemoveModule = ({ params, onSubmit }: { params: RemoveModuleFlowProps; onSubmit: () => void }) => {
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
      <Grid
        container
        sx={{
          gap: 1,
          alignItems: 'center',
        }}
      >
        <Grid item xs={2}>
          Module
        </Grid>
        <Typography variant="body2" component="div">
          <EthHashInfo address={params.address} shortAddress={false} hasExplorer showCopyButton />
        </Typography>
      </Grid>
      <Typography
        sx={{
          my: 2,
        }}
      >
        After removing this module, any feature or app that uses this module might no longer work. If this Safe Account
        requires more then one signature, the module removal will have to be confirmed by other signers as well.
      </Typography>
    </ReviewTransaction>
  )
}
