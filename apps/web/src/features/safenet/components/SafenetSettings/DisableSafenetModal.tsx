import ChainIndicator from '@/components/common/ChainIndicator'
import ModalDialog from '@/components/common/ModalDialog'
import { TxModalContext } from '@/components/tx-flow'
import useChainId from '@/hooks/useChainId'
import { useGetSafenetConfigQuery } from '@/store/safenet'
import CloseIcon from '@mui/icons-material/Close'
import { Alert, AlertTitle, Button, DialogActions, DialogContent, Stack, Typography } from '@mui/material'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { useContext, useState, type ReactElement } from 'react'
import useIsSafenetEnabled from '../../hooks/useIsSafenetEnabled'
import DisableSafenetFlow from '../tx-flow/DisableSafenet'
import css from './styles.module.css'

const DisableSafenetModal = ({ onClose }: { onClose: () => void }): ReactElement => {
  const { setTxFlow } = useContext(TxModalContext)
  const chainId = useChainId()
  const [canDisable, setCanDisable] = useState<boolean>(false)

  const isSafenetEnabled = useIsSafenetEnabled()

  const { data: safenetConfig } = useGetSafenetConfigQuery(!isSafenetEnabled ? skipToken : undefined)
  const safenetModuleAddress = safenetConfig?.settlementEngines[chainId]

  // TODO: Get pending settlements form the Processor API and set `canDisable` accordingly

  const handleDisableSafenet = () => {
    if (!safenetModuleAddress) return

    onClose()
    setTxFlow(<DisableSafenetFlow moduleAddress={safenetModuleAddress} />)
  }

  return (
    <ModalDialog
      data-testid="disable-safenet-dialog"
      open
      onClose={onClose}
      dialogTitle="Are you sure?"
      hideChainIndicator
      maxWidth="xs"
    >
      <DialogContent sx={{ mt: 3 }}>
        <Stack spacing={2}>
          <Typography fontWeight={700}>Disabling Safenet will result in the loss of:</Typography>
          <Stack flexDirection="row" gap={2}>
            <CloseIcon className={css.closeIcon} />
            <Typography>Aggregation of Ethereum&apos;s assets in the unified balance</Typography>
          </Stack>
          <Stack flexDirection="row" gap={2}>
            <CloseIcon className={css.closeIcon} />
            <Typography>Instant cross-chain transactions on Ethereum, without bridging</Typography>
          </Stack>
          <Stack flexDirection="row" gap={2}>
            <CloseIcon className={css.closeIcon} />
            <Typography>Sponsored transactions on Ethereum</Typography>
          </Stack>
          {!canDisable && (
            <Alert severity="warning" sx={{ mt: 5 }}>
              <AlertTitle>
                <Typography variant="h5" fontWeight={700}>
                  Pending Transactions Detected
                </Typography>
              </AlertTitle>
              <Typography variant="body2" textAlign="left">
                You have pending transactions that must be completed before you can disable Safenet
              </Typography>
              {/* Link to view the transactions */}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {canDisable && safenetModuleAddress && (
          <Button onClick={handleDisableSafenet} variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}>
            Disable Safenet on
            <ChainIndicator chainId={chainId} className={css.chainIndicator} />
          </Button>
        )}
      </DialogActions>
    </ModalDialog>
  )
}

export default DisableSafenetModal
