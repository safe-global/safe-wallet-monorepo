import React, { useState, type SyntheticEvent } from 'react'
import useSuperChainAccount from '@/hooks/super-chain/useSuperChainAccount'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import AcceptInvite from './AcceptInvite'
import { ModalContext } from '..'
import LoadingTxn from './LoadingTxn'
import FailedTxn from './FailedTxn'
export const ADD_OWNER_MODAL_QUERY_PARAM = 'addOwnerModal'

export enum ModalState {
  AcceptInvite,
  LoadingTXN,
  FailedTXN,
}

function AlertModal({ modalContext, onClose }: { modalContext: ModalContext; onClose: () => void }) {
  const [modalState, setModalState] = useState<ModalState>(ModalState.AcceptInvite)
  const router = useRouter()
  const { getWriteableSuperChainSmartAccount, publicClient } = useSuperChainAccount()
  const onCloseAndErase = () => {
    onClose()
    setModalState(ModalState.AcceptInvite)
  }
  const handleAcceptInvitation = async () => {
    const superChainSmartAccountContract = getWriteableSuperChainSmartAccount()
    try {
      setModalState(ModalState.LoadingTXN)
      const hash = await superChainSmartAccountContract?.write.addOwnerWithThreshold([
        modalContext.safe,
        modalContext.newOwner,
      ])
      await publicClient.waitForTransactionReceipt({ hash: hash! })
      await new Promise((resolve) => setTimeout(resolve, 5000))
      onCloseAndErase()
      router.push({
        pathname: AppRoutes.home,
        query: {
          safe: modalContext.safe,
          [ADD_OWNER_MODAL_QUERY_PARAM]: true,
          superChainId: modalContext.superChainId,
        },
      })
    } catch (e) {
      console.error(e)
      setModalState(ModalState.FailedTXN)
    }
  }

  return (
    <>
      {modalState === ModalState.AcceptInvite && (
        <AcceptInvite
          modalContext={modalContext}
          onClose={onCloseAndErase}
          handleAcceptInvitation={handleAcceptInvitation}
        />
      )}
      {modalState === ModalState.LoadingTXN && <LoadingTxn open={true} onClose={onCloseAndErase} />}
      {modalState === ModalState.FailedTXN && (
        <FailedTxn open={true} onClose={onCloseAndErase} handleRetry={handleAcceptInvitation} />
      )}
    </>
  )
}

export default AlertModal
