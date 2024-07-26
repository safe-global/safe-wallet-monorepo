import { ReactElement, useState } from 'react'
import LoadingTxn from './states/LoadingTxn'
import FailedTxn from './states/FailedTxn'
import SuccessTxn from './states/SuccessTxn'
import TopUp from './states/TopUp'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { Address, createPublicClient, createWalletClient, custom, http, parseEther } from 'viem'
import { sepolia, optimism } from 'viem/chains'
import { CHAIN_ID, JSON_RPC_PROVIDER } from '@/features/superChain/constants'

export enum ModalState {
  TopUp,
  LoadingTXN,
  FailedTxn,
  Success,
}

const TopUpModal = ({ open, onClose }: { open: boolean; onClose: () => void }): ReactElement => {
  const [modalState, setModalState] = useState<ModalState>(ModalState.TopUp)
  const [currentValue, setCurrentValue] = useState<null | bigint>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const safeAddress = useSafeAddress()
  const wallet = useWallet()

  const handleTopUp = async (value: bigint) => {
    if (!wallet) return
    const walletClient = createWalletClient({
      chain: CHAIN_ID === sepolia.id.toString() ? sepolia : optimism,
      transport: custom(wallet?.provider),
    })
    const publicClient = createPublicClient({
      chain: CHAIN_ID === sepolia.id.toString() ? sepolia : optimism,
      transport: http(JSON_RPC_PROVIDER),
    })
    try {
      setCurrentValue(value)
      const tx = await walletClient.sendTransaction({
        to: safeAddress as Address,
        account: wallet.address as Address,
        value,
      })
      setModalState(ModalState.LoadingTXN)
      setTransactionHash(tx)
      const result = await publicClient.waitForTransactionReceipt({
        hash: tx,
        pollingInterval: 1000,
        confirmations: 1,
      })
      if (result.status === 'reverted') {
        throw new Error('Transaction reverted')
      }

      setModalState(ModalState.Success)
    } catch (_) {
      setModalState(ModalState.FailedTxn)
    }
  }

  const handleRetry = async () => {
    if (!currentValue) return
    handleTopUp(currentValue)
  }

  const onCloseAndErase = () => {
    onClose()
    setModalState(ModalState.TopUp)
    setCurrentValue(null)
    setTransactionHash(null)
  }

  return (
    <>
      {modalState === ModalState.TopUp && <TopUp open={open} onClose={onCloseAndErase} handleTopUp={handleTopUp} />}
      {modalState === ModalState.LoadingTXN && (
        <LoadingTxn hash={transactionHash!} open={open} onClose={onCloseAndErase} />
      )}
      {modalState === ModalState.FailedTxn && (
        <FailedTxn handleRetry={handleRetry} open={open} onClose={onCloseAndErase} />
      )}
      {modalState === ModalState.Success && (
        <SuccessTxn hash={transactionHash!} value={currentValue!} open={open} onClose={onCloseAndErase} />
      )}
    </>
  )
}

export default TopUpModal
