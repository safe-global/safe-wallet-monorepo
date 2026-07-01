import useGasPrice from '@/hooks/useGasPrice'
import ModalDialog from '@/components/common/ModalDialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import RocketSpeedup from '@/public/images/common/ic-rocket-speedup.svg'
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
import { type TransactionOptions } from '@safe-global/types-kit'
import { PendingTxType, type PendingProcessingTx } from '@/store/pendingTxsSlice'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { MODALS_EVENTS, trackEvent, MixpanelEventParams } from '@/services/analytics'
import { TX_EVENTS } from '@/services/analytics/events/transactions'
import { getTransactionTrackingType } from '@/services/analytics/tx-tracking'
import { isGtfSafePaid } from '@safe-global/utils/utils/isGtfSafePaid'
import { trackError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import CheckWallet from '@/components/common/CheckWallet'
import { useLazyTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
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
const SpeedUpModal = ({ open, handleClose, pendingTx, txId, txHash, signerAddress, signerNonce, gasLimit }: Props) => {
  const [speedUpFee] = useGasPrice(true)
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false)
  const isEIP1559 = useHasFeature(FEATURES.EIP1559)
  const isGtfChain = useHasFeature(FEATURES.GTF) ?? false

  const wallet = useWallet()
  const onboard = useOnboard()
  const chainInfo = useCurrentChain()
  const safeAddress = useSafeAddress()
  const hasActions = signerAddress && signerAddress === wallet?.address
  const dispatch = useAppDispatch()
  const [trigger] = useLazyTransactionsGetTransactionByIdV1Query()
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
        const { data: details } = await trigger({ chainId: chainInfo.chainId, id: txId })
        const txType = getTransactionTrackingType(details)
        const gasPaymentSource = isGtfChain ? (isGtfSafePaid(safeTx.data) ? 'safe' : 'signing_wallet') : undefined
        trackEvent(
          { ...TX_EVENTS.SPEED_UP, label: txType },
          gasPaymentSource ? { [MixpanelEventParams.GAS_PAYMENT_SOURCE]: gasPaymentSource } : undefined,
        )
      } else {
        await dispatchCustomTxSpeedUp(
          txOptions as Omit<TransactionOptions, 'nonce'> & { nonce: number },
          txId,
          pendingTx.to,
          pendingTx.data,
          wallet.provider,
          pendingTx.chainId,
          wallet.address,
          pendingTx.safeAddress,
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
        <div className="p-6">
          <div className="mb-4 flex items-center justify-center">
            <RocketSpeedup className="size-[90px]" />
          </div>

          <Typography data-testid="speedup-summary">
            This will speed up the pending transaction by{' '}
            <Typography variant="paragraph-bold" className="inline">
              replacing
            </Typography>{' '}
            the original gas parameters with new ones.
          </Typography>

          <div className="mt-4">
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
          </div>
          <div className="[&:not(:empty)]:mt-6">
            <NetworkWarning />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>

          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <CheckWallet checkNetwork={!isDisabled}>
                {(isOk) => (
                  <Button disabled={!isOk || isDisabled} onClick={onSubmit}>
                    {isDisabled ? <Spinner className="size-5" /> : 'Confirm'}
                  </Button>
                )}
              </CheckWallet>
            </TooltipTrigger>
            <TooltipContent>Speed up transaction</TooltipContent>
          </Tooltip>
        </div>
      </ModalDialog>
    )
  }

  return (
    <ModalDialog open={open} onClose={handleClose} dialogTitle="Speed up transaction">
      <div className="p-6">
        <div className="mb-4 flex items-center justify-center">
          <RocketSpeedup className="size-[90px]" />
        </div>

        <Typography data-testid="speedup-summary">
          Is this transaction taking too long? Speed it up by using the &quot;speed up&quot; option in your connected
          wallet.
        </Typography>
      </div>
    </ModalDialog>
  )
}

export default SpeedUpModal
