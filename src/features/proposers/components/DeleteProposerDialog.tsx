import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { getDelegateTypedData } from '@/features/proposers/utils/utils'
import useWallet from '@/hooks/wallets/useWallet'
import DeleteIcon from '@/public/images/common/delete.svg'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { useAppDispatch } from '@/store'
import { useDeleteProposerMutation } from '@/store/api/gateway'
import { showNotification } from '@/store/notificationsSlice'
import { shortenAddress } from '@/utils/formatters'
import { signTypedData } from '@/utils/web3'
import type { Delegate } from '@safe-global/safe-gateway-typescript-sdk/dist/types/delegates'
import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  Typography,
  IconButton,
  Divider,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  SvgIcon,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import madProps from '@/utils/mad-props'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import ErrorMessage from '@/components/tx/ErrorMessage'

type DeleteProposerProps = {
  wallet: ReturnType<typeof useWallet>
  safeAddress: ReturnType<typeof useSafeAddress>
  chainId: ReturnType<typeof useChainId>
  proposer: Delegate
}

const _DeleteProposer = ({ wallet, safeAddress, chainId, proposer }: DeleteProposerProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const [error, setError] = useState<Error>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [deleteProposer] = useDeleteProposerMutation()
  const dispatch = useAppDispatch()

  const onConfirm = async () => {
    setError(undefined)
    setIsLoading(true)

    if (!wallet?.provider || !safeAddress || !chainId) {
      setIsLoading(false)
      setError(new Error('Please connect your wallet first'))
      return
    }

    try {
      const signer = await getAssertedChainSigner(wallet.provider)
      const typedData = getDelegateTypedData(chainId, proposer.delegate)
      const signature = await signTypedData(signer, typedData)

      await deleteProposer({ chainId, delegateAddress: proposer.delegate, safeAddress, signature })

      trackEvent(SETTINGS_EVENTS.PROPOSERS.SUBMIT_REMOVE_PROPOSER)

      dispatch(
        showNotification({
          variant: 'success',
          groupKey: 'delete-proposer-success',
          title: 'Proposer deleted successfully!',
          message: `${shortenAddress(proposer.delegate)} can not suggest transactions anymore.`,
        }),
      )
    } catch (error) {
      setIsLoading(false)
      setError(error as Error)
      return
    }

    setIsLoading(false)
    setOpen(false)
  }

  const onCancel = () => {
    trackEvent(SETTINGS_EVENTS.PROPOSERS.CANCEL_REMOVE_PROPOSER)
    setOpen(false)
  }

  const canEdit = wallet?.address === proposer.delegate || wallet?.address === proposer.delegator

  return (
    <>
      <CheckWallet>
        {(isOk) => (
          <Track {...SETTINGS_EVENTS.PROPOSERS.REMOVE_PROPOSER}>
            <IconButton
              data-testid="delete-proposer-btn"
              onClick={() => setOpen(true)}
              color="error"
              size="small"
              disabled={!isOk || !canEdit}
            >
              <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
            </IconButton>
          </Track>
        )}
      </CheckWallet>

      <Dialog open={open} onClose={onCancel}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Delete this proposer?
            </Typography>

            <Box flexGrow={1} />

            <IconButton aria-label="close" onClick={onCancel} sx={{ marginLeft: 'auto' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Box>
            <Typography>
              Deleting this proposer will permanently remove the address, and it won&apos;t be able to suggest
              transactions anymore.
              <br />
              <br />
              To complete this action, confirm it with your connected wallet signature.
            </Typography>
          </Box>

          {error && (
            <Box mt={2}>
              <ErrorMessage error={error}>Error deleting proposer</ErrorMessage>
            </Box>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ padding: 3, justifyContent: 'space-between' }}>
          <Button size="small" variant="text" onClick={onCancel}>
            No, keep it
          </Button>

          <Button
            size="small"
            variant="danger"
            onClick={onConfirm}
            disabled={isLoading}
            sx={{
              minWidth: '122px',
              minHeight: '36px',
            }}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Yes, delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const DeleteProposerDialog = madProps(_DeleteProposer, {
  wallet: useWallet,
  chainId: useChainId,
  safeAddress: useSafeAddress,
})

export default DeleteProposerDialog
