import useWallet from '@/hooks/wallets/useWallet'
import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import SvgIcon from '@mui/material/SvgIcon'
import CircularProgress from '@mui/material/CircularProgress'
import { Close } from '@mui/icons-material'
import madProps from '@/utils/mad-props'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import { deleteTx } from '@/utils/gateway'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import InfoIcon from '@/public/images/notifications/info.svg'
import ErrorMessage from '@/components/tx/ErrorMessage'
import ExternalLink from '@/components/common/ExternalLink'
import ChainIndicator from '@/components/common/ChainIndicator'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { REJECT_TX_EVENTS } from '@/services/analytics/events/reject-tx'
import { trackEvent } from '@/services/analytics'
import { isWalletRejection } from '@/utils/wallets'

type DeleteTxModalProps = {
  safeTxHash: string
  onClose: () => void
  onSuccess: () => void
  wallet: ReturnType<typeof useWallet>
  chainId: ReturnType<typeof useChainId>
  safeAddress: ReturnType<typeof useSafeAddress>
}

const InternalDeleteTxModal = ({
  safeTxHash,
  onSuccess,
  onClose,
  wallet,
  safeAddress,
  chainId,
}: DeleteTxModalProps) => {
  const [error, setError] = useState<Error>()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const onConfirm = async () => {
    setError(undefined)
    setIsLoading(true)
    trackEvent(REJECT_TX_EVENTS.DELETE_CONFIRM)

    if (!wallet?.provider || !safeAddress || !chainId || !safeTxHash) {
      setIsLoading(false)
      setError(new Error('Please connect your wallet first'))
      trackEvent(REJECT_TX_EVENTS.DELETE_FAIL)
      return
    }

    try {
      const signer = await getAssertedChainSigner(wallet.provider)

      await deleteTx({
        safeTxHash,
        safeAddress,
        chainId,
        signer,
      })
    } catch (error) {
      setIsLoading(false)
      setError(error as Error)
      trackEvent(isWalletRejection(error as Error) ? REJECT_TX_EVENTS.DELETE_CANCEL : REJECT_TX_EVENTS.DELETE_FAIL)
      return
    }

    setIsLoading(false)
    txDispatch(TxEvent.DELETED, { safeTxHash })
    onSuccess()
    trackEvent(REJECT_TX_EVENTS.DELETE_SUCCESS)
  }

  const onCancel = () => {
    trackEvent(REJECT_TX_EVENTS.DELETE_CANCEL)
    onClose()
  }

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>
        <Box
          data-testid="untrusted-token-warning"
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <SvgIcon component={InfoIcon} inheritViewBox color="error" />
            Delete this transaction?
          </Typography>

          <Box
            sx={{
              flexGrow: 1,
            }}
          />

          <ChainIndicator chainId={chainId} />

          <IconButton aria-label="close" onClick={onClose} sx={{ marginLeft: 'auto' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box>
          Are you sure you want to delete this transaction? This will permanently remove it from the queue but the
          already given signatures will remain valid.
        </Box>

        <Box
          sx={{
            mt: 2,
          }}
        >
          Make sure that you are aware of the{' '}
          <ExternalLink href="https://help.safe.global/en/articles/40836-why-do-i-need-to-pay-for-cancelling-a-transaction">
            potential risks
          </ExternalLink>{' '}
          related to deleting a transaction off-chain.
        </Box>

        {error && (
          <Box
            sx={{
              mt: 2,
            }}
          >
            <ErrorMessage error={error}>Error deleting transaction</ErrorMessage>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ padding: 3, justifyContent: 'space-between' }}>
        <Button size="small" variant="text" onClick={onCancel}>
          Keep it
        </Button>

        <Button
          data-testid="delete-tx-btn"
          size="small"
          variant="contained"
          color="primary"
          onClick={onConfirm}
          disabled={isLoading}
          sx={{ minWidth: '122px', minHeight: '36px' }}
        >
          {isLoading ? <CircularProgress size={20} /> : 'Yes, delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const DeleteTxModal = madProps(InternalDeleteTxModal, {
  wallet: useWallet,
  chainId: useChainId,
  safeAddress: useSafeAddress,
})

export default DeleteTxModal
