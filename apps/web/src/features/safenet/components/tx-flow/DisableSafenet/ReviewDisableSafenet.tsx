import ChainIndicator from '@/components/common/ChainIndicator'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import useChainId from '@/hooks/useChainId'
import InfoIcon from '@/public/images/notifications/info.svg'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { Errors, logError } from '@/services/exceptions'
import { createMultiSendCallOnlyTx, createRemoveGuardTx, createRemoveModuleTx } from '@/services/tx/tx-sender'
import { Alert, Box, Stack, SvgIcon, Typography } from '@mui/material'
import type { MetaTransactionData, SafeTransaction } from '@safe-global/safe-core-sdk-types/dist/src/types'
import { useContext, useEffect } from 'react'
import { type DisableSafenetFlowProps } from '.'
import css from './styles.module.css'

const onFormSubmit = () => {
  trackEvent(SETTINGS_EVENTS.MODULES.REMOVE_MODULE)
}

const ReviewDisableSafenet = ({ params }: { params: DisableSafenetFlowProps }) => {
  const { setSafeTx, safeTxError, setSafeTxError } = useContext(SafeTxContext)
  const chainId = useChainId()

  useEffect(() => {
    async function getTxs(): Promise<SafeTransaction> {
      const txs: MetaTransactionData[] = [
        (await createRemoveModuleTx(params.moduleAddress)).data,
        (await createRemoveGuardTx()).data,
      ]

      return createMultiSendCallOnlyTx(txs)
    }

    getTxs().then(setSafeTx).catch(setSafeTxError)
  }, [setSafeTx, setSafeTxError, params.moduleAddress])

  useEffect(() => {
    if (safeTxError) {
      logError(Errors._806, safeTxError.message)
    }
  }, [safeTxError])

  return (
    <SignOrExecuteForm onSubmit={onFormSubmit}>
      <Stack flexDirection="row" gap={1} alignItems="center">
        <Typography my={2}>Disable Safenet on</Typography>
        <Box className={css.chainChip}>
          <ChainIndicator chainId={chainId} />
        </Box>
      </Stack>
      <Alert icon={<SvgIcon component={InfoIcon} inheritViewBox color="primary" />} className={css.alert}>
        Disabling Safenet means you will not be able to enjoy its benefits. Everything else in your account will remain
        the same.
      </Alert>
    </SignOrExecuteForm>
  )
}

export default ReviewDisableSafenet
