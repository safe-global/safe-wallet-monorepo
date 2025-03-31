import useGasPrice from '@/hooks/useGasPrice'
import ModalDialog from '@/components/common/ModalDialog'
import DialogContent from '@mui/material/DialogContent'
import { Box, Button, CircularProgress, SvgIcon, Tooltip, Typography } from '@mui/material'
import RocketSpeedup from '@/public/images/common/ic-rocket-speedup.svg'
import DialogActions from '@mui/material/DialogActions'
import useWallet from '@/hooks/wallets/useWallet'
import useOnboard from '@/hooks/wallets/useOnboard'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppDispatch } from '@/store'
import { createExistingTx, dispatchCustomTxSpeedUp, dispatchSafeTxSpeedUp } from '@/services/tx/tx-sender'
import { showNotification } from '@/store/notificationsSlice'
import { useCallback, useState } from 'react'
import GasParams from '@/components/tx/GasParams'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { getTxOptions } from '@/utils/transactions'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { SimpleTxWatcher } from '@/utils/SimpleTxWatcher'
import { isWalletRejection } from '@/utils/wallets'
import { type TransactionOptions } from '@safe-global/safe-core-sdk-types'
import { PendingTxType, type PendingProcessingTx } from '@/store/pendingTxsSlice'
import useAsync from '@/hooks/useAsync'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { TX_EVENTS } from '@/services/analytics/events/transactions'
import { getTransactionTrackingType } from '@/services/analytics/tx-tracking'
import { trackError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import CheckWallet from '@/components/common/CheckWallet'
import { useLazyGetTransactionDetailsQuery } from '@/store/api/gateway'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import { FEATURES } from '@safe-global/utils/utils/chains'

type Props = {
  open: boolean
  handleClose: () => void
  pendingTx: PendingProcessingTx
  txId: string
  txHash: string
  signerAddress: string | undefined
  signerNonce: number
  gasLimit: string | number | undefined
}
export const SpeedUpModal = ({
  open,
  handleClose,
  pendingTx,
  txId,
  txHash,
  signerAddress,
  signerNonce,
  gasLimit,
}: Props) => {
  const [speedUpFee] = useGasPrice(true)
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false)
  const isEIP1559 = useHasFeature(FEATURES.EIP1559)

  const wallet = useWallet()
  const onboard = useOnboard()
  const chainInfo = useCurrentChain()
  const safeAddress = useSafeAddress()
  const hasActions = signerAddress && signerAddress === wallet?.address
  const dispatch = useAppDispatch()
  const [trigger] = useLazyGetTransactionDetailsQuery()
  const isDisabled = waitingForConfirmation || !wallet || !speedUpFee || !onboard
  const [safeTx] = useAsync(() => {
    if (!chainInfo?.chainId) return
    return createExistingTx(chainInfo.chainId, txId)
  }, [txId, chainInfo?.chainId])

  const safeTxHasSignatures = !!safeTx?.signatures?.size ? true : false

  const onCancel = () => {
    trackEvent(MODALS_EVENTS.CANCEL_SPEED_UP)
    handleClose()
  }

  const onSubmit = useCallback(async () => {
    if (!wallet || !speedUpFee || !onboard || !chainInfo || !safeTx) {
      return null
    }

    const txOptions = getTxOptions(
      {
        ...speedUpFee,
        gasLimit: typeof gasLimit === 'undefined' ? null : BigInt(gasLimit),
      },
      chainInfo,
    )
    txOptions.nonce = signerNonce

    try {
      setWaitingForConfirmation(true)

      if (pendingTx.txType === PendingTxType.SAFE_TX) {
        await dispatchSafeTxSpeedUp(
          txOptions as Omit<TransactionOptions, 'nonce'> & { nonce: number },
          txId,
          wallet.provider,
          chainInfo.chainId,
          wallet.address,
          safeAddress,
          safeTx.data.nonce,
        )
        const { data: details } = await trigger({ chainId: chainInfo.chainId, txId })
        const txType = getTransactionTrackingType(details)
        trackEvent({ ...TX_EVENTS.SPEED_UP, label: txType })
      } else {
        await dispatchCustomTxSpeedUp(
          txOptions as Omit<TransactionOptions, 'nonce'> & { nonce: number },
          txId,
          pendingTx.to,
          pendingTx.data,
          wallet.provider,
          wallet.address,
          pendingTx.nonce,
        )
        // Currently all custom txs are batch executes
        trackEvent({ ...TX_EVENTS.SPEED_UP, label: 'batch' })
      }

      if (txHash) {
        SimpleTxWatcher.getInstance().stopWatchingTxHash(txHash)
      }

      setWaitingForConfirmation(false)
      handleClose()
    } catch (e) {
      const error = asError(e)
      setWaitingForConfirmation(false)
      if (!isWalletRejection(error)) {
        trackError(ErrorCodes._814, error)
        dispatch(
          showNotification({
            message: 'Speed up failed',
            variant: 'error',
            detailedMessage: error.message,
            groupKey: txHash,
          }),
        )
      }
    }
  }, [
    chainInfo,
    dispatch,
    gasLimit,
    handleClose,
    onboard,
    pendingTx,
    safeAddress,
    signerNonce,
    speedUpFee,
    txHash,
    txId,
    wallet,
    safeTx,
    trigger,
  ])

  if (!hasActions) {
    return null
  }

  if (safeTxHasSignatures) {
    return (
      <ModalDialog open={open} onClose={onCancel} dialogTitle="Speed up transaction">
        <DialogContent sx={{ p: '24px !important' }}>
          <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
            <SvgIcon inheritViewBox component={RocketSpeedup} sx={{ width: 90, height: 90 }} />
          </Box>

          <Typography data-testid="speedup-summary">
            This will speed up the pending transaction by{' '}
            <Typography component="span" fontWeight={700}>
              replacing
            </Typography>{' '}
            the original gas parameters with new ones.
          </Typography>

          <Box mt={2}>
            {speedUpFee && signerNonce && (
              <GasParams
                params={{
                  // nonce: safeTx?.data?.nonce,
                  userNonce: signerNonce,
                  gasLimit: typeof gasLimit === 'undefined' ? null : BigInt(gasLimit),
                  maxFeePerGas: speedUpFee.maxFeePerGas,
                  maxPriorityFeePerGas: speedUpFee.maxPriorityFeePerGas,
                }}
                isExecution={true}
                isEIP1559={isEIP1559}
                willRelay={false}
              />
            )}
          </Box>
          <Box sx={{ '&:not(:empty)': { mt: 3 } }}>
            <NetworkWarning />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onCancel}>Cancel</Button>

          <Tooltip title="Speed up transaction">
            <CheckWallet checkNetwork={!isDisabled}>
              {(isOk) => (
                <Button
                  color="primary"
                  disabled={!isOk || isDisabled}
                  onClick={onSubmit}
                  variant="contained"
                  disableElevation
                >
                  {isDisabled ? <CircularProgress size={20} /> : 'Confirm'}
                </Button>
              )}
            </CheckWallet>
          </Tooltip>
        </DialogActions>
      </ModalDialog>
    )
  }

  return (
    <ModalDialog open={open} onClose={handleClose} dialogTitle="Speed up transaction">
      <DialogContent sx={{ p: '24px !important' }}>
        <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
          <SvgIcon inheritViewBox component={RocketSpeedup} sx={{ width: 90, height: 90 }} />
        </Box>

        <Typography data-testid="speedup-summary">
          Is this transaction taking too long? Speed it up by using the &quot;speed up&quot; option in your connected
          wallet.
        </Typography>
      </DialogContent>
    </ModalDialog>
  )
}
