import { useState, type ReactElement } from 'react'
import useSuperChainAccount from '@/hooks/super-chain/useSuperChainAccount'
import useSafeAddress from '@/hooks/useSafeAddress'
import { type ADD_EOA_INITIAL_STATE } from '@/components/common/SuperChainEOAS'
import AddEOA from './states/AddEOA'
import LoadingModal from '@/components/common/LoadingModal'
import SuccessAdded from './states/SuccessAdded'
import FailedTxnModal from '@/components/common/ErrorModal'
import { Address } from 'viem'

export enum ModalState {
  AddEOA,
  Loading,
  Success,
  Error,
}
export type NewEOAEntry = {
  address: Address
}

const AddEOAModal = ({
  context,
  onClose,
}: {
  context: typeof ADD_EOA_INITIAL_STATE
  onClose: () => void
}): ReactElement => {
  const { getSponsoredWriteableSuperChainSmartAccount } = useSuperChainAccount()
  const SmartAccountAddres = useSafeAddress()
  const [currentNewEOAAddress, setCurrentNewEOAAddress] = useState<Address | null>(null)
  const [modalState, setModalState] = useState<ModalState>(ModalState.AddEOA)

  const onSubmit = async (data: NewEOAEntry) => {
    const superChainSmartAccountSponsored = getSponsoredWriteableSuperChainSmartAccount()
    try {
      setCurrentNewEOAAddress(data.address)
      setModalState(ModalState.Loading)
      await superChainSmartAccountSponsored?.write.populateAddOwner([SmartAccountAddres as Address, data.address])
      setModalState(ModalState.Success)
    } catch (e) {
      setModalState(ModalState.Error)
    }
  }
  const handleRetry = async () => {
    if (!currentNewEOAAddress) return
    onSubmit({ address: currentNewEOAAddress })
  }

  const onCloseAndClear = () => {
    setModalState(ModalState.AddEOA)
    setCurrentNewEOAAddress(null)
    onClose()
  }

  return (
    <>
      {modalState === ModalState.AddEOA && <AddEOA onSubmit={onSubmit} onClose={onCloseAndClear} context={context} />}
      {modalState === ModalState.Loading && <LoadingModal open={context.open} title="Inviting EOA" />}
      {modalState === ModalState.Success && <SuccessAdded onClose={onCloseAndClear} context={context} />}
      {modalState === ModalState.Error && (
        <FailedTxnModal handleRetry={handleRetry} open={context.open} onClose={onCloseAndClear} />
      )}
    </>
  )
}

export default AddEOAModal
