import ModalDialog from '@/components/common/ModalDialog'
import { ReactElement, useState } from 'react'
import LoadingTxn from './states/LoadingTxn'
import FailedTxn from './states/FailedTxn'
import SuccessTxn from './states/SuccessTxn'
import TopUp from './states/TopUp'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { Address, createWalletClient, custom, parseEther } from 'viem'
import { sepolia } from 'viem/chains'

export enum ModalState {
  TopUp,
  LoadingTXN,
  FailedTxn,
  Success,
}

const TopUpModal = ({ open, onClose }: { open: boolean; onClose: () => void }): ReactElement => {
  const [modalState, setModalState] = useState<ModalState>(ModalState.TopUp)
  const safeAddress = useSafeAddress()
  const wallet = useWallet()

  const handleTopUp = async (value: bigint) => {
    if (!wallet) return
    const walletClient = createWalletClient({
      chain: sepolia,
      transport: custom(wallet?.provider),
    })
    setModalState(ModalState.LoadingTXN)
    try {
      await walletClient.sendTransaction({
        to: safeAddress as Address,
        account: wallet.address as Address,
        value,
      })
      setModalState(ModalState.Success)
    } catch (_) {
      setModalState(ModalState.FailedTxn)
    }
  }

  return (
    <ModalDialog
      open={open}
      hideChainIndicator
      dialogTitle={modalState === ModalState.TopUp ? 'Top-up your account' : ''}
      onClose={onClose}
    >
      {modalState === ModalState.TopUp && <TopUp handleTopUp={handleTopUp} />}
      {modalState === ModalState.LoadingTXN && <LoadingTxn />}
      {modalState === ModalState.FailedTxn && <FailedTxn setModalState={setModalState} />}
      {modalState === ModalState.Success && <SuccessTxn />}
    </ModalDialog>
  )
}

export default TopUpModal
