import useWallet from '@/hooks/wallets/useWallet'
import { useState } from 'react'
import madProps from '@/utils/mad-props'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import { deleteTx } from '@/utils/gateway'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import ChainIndicator from '@/components/common/ChainIndicator'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { REJECT_TX_EVENTS } from '@/services/analytics/events/reject-tx'
import { trackEvent } from '@/services/analytics'
import { isWalletRejection } from '@/utils/wallets'
import CheckWallet from '@/components/common/CheckWallet'
import ChainSwitcher from '@/components/common/ChainSwitcher'
import { DeleteTxModalView } from '@views/components/tx-flow/flows/ReplaceTx/DeleteTxModalView'

type DeleteTxModalProps = {
  safeTxHash: string
  onClose: () => void
  onSuccess: () => void
  wallet: ReturnType<typeof useWallet>
  chain: ReturnType<typeof useCurrentChain>
  safeAddress: ReturnType<typeof useSafeAddress>
}

const InternalDeleteTxModal = ({ safeTxHash, onSuccess, onClose, wallet, safeAddress, chain }: DeleteTxModalProps) => {
  const [error, setError] = useState<Error>()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const onConfirm = async () => {
    setError(undefined)
    setIsLoading(true)
    trackEvent(REJECT_TX_EVENTS.DELETE_CONFIRM)

    if (!wallet?.provider || !safeAddress || !chain || !safeTxHash) {
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
        chain,
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
    <DeleteTxModalView
      chainIndicator={<ChainIndicator chainId={chain?.chainId} />}
      chainSwitcher={<ChainSwitcher />}
      error={error}
      isLoading={isLoading}
      onClose={onClose}
      onCancel={onCancel}
      onConfirm={onConfirm}
      renderCheckWallet={(render) => <CheckWallet checkNetwork>{render}</CheckWallet>}
    />
  )
}

const DeleteTxModal = madProps(InternalDeleteTxModal, {
  wallet: useWallet,
  chain: useCurrentChain,
  safeAddress: useSafeAddress,
})

export default DeleteTxModal
