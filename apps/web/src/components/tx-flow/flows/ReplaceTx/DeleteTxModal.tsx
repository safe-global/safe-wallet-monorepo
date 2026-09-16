import useWallet from '@/hooks/wallets/useWallet'
import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { X as Close } from 'lucide-react'
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
import CheckWallet from '@/components/common/CheckWallet'
import ChainSwitcher from '@/components/common/ChainSwitcher'

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
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogTitle render={<div />} className="p-4">
          <div data-testid="untrusted-token-warning" className="flex items-center">
            <Typography variant="paragraph-bold" className="flex items-center gap-2">
              <InfoIcon className="size-5 text-[var(--color-error-main)]" />
              Delete this transaction?
            </Typography>

            <div className="grow" />

            <ChainIndicator chainId={chainId} />

            <Button aria-label="close" variant="ghost" size="icon-sm" onClick={onClose} className="ml-auto">
              <Close />
            </Button>
          </div>
        </DialogTitle>

        <Separator />

        <div className="p-6">
          <div>
            Are you sure you want to delete this transaction? This will permanently remove it from the queue but the
            already given signatures will remain valid.
          </div>

          <div className="mt-4">
            Make sure that you are aware of the{' '}
            <ExternalLink href="https://help.safe.global/articles/4016097317-Why-do-I-need-to-pay-for-cancelling-a-transaction?">
              potential risks
            </ExternalLink>{' '}
            related to deleting a transaction off-chain.
          </div>

          <div className="mt-4">
            <ChainSwitcher />
          </div>

          {error && (
            <div className="mt-4">
              <ErrorMessage error={error}>Error deleting transaction</ErrorMessage>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between p-6">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Keep it
          </Button>

          <CheckWallet checkNetwork>
            {(isOk) => (
              <Button
                data-testid="delete-tx-btn"
                size="sm"
                onClick={onConfirm}
                disabled={!isOk || isLoading}
                className="min-h-9 min-w-[122px]"
              >
                {isLoading ? <Spinner className="size-5" /> : 'Yes, delete'}
              </Button>
            )}
          </CheckWallet>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const DeleteTxModal = madProps(InternalDeleteTxModal, {
  wallet: useWallet,
  chainId: useChainId,
  safeAddress: useSafeAddress,
})

export default DeleteTxModal
