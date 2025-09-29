import { useMemo } from 'react'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { extractAppSigners } from '../utils'
import { selectSigners } from '@/src/store/signersSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

export const useTxSignerState = (detailedExecutionInfo?: MultisigExecutionDetails) => {
  const activeSafe = useDefinedActiveSafe()
  const activeSigner = useAppSelector((state: RootState) => selectActiveSigner(state, activeSafe.address))
  const signers = useAppSelector(selectSigners)

  const appSigners = useMemo(() => extractAppSigners(signers, detailedExecutionInfo), [signers, detailedExecutionInfo])

  const activeTxSigner = useMemo(
    () => appSigners.find((signer) => signer.value === activeSigner?.value),
    [appSigners, activeSigner],
  )

  const hasSigned = useMemo(() => {
    return detailedExecutionInfo?.confirmations?.some(
      (confirmation) => confirmation.signer.value === activeSigner?.value,
    )
  }, [detailedExecutionInfo, activeSigner])

  const availableSigners = useMemo(() => {
    return appSigners.filter((signer) => {
      return !detailedExecutionInfo?.confirmations?.some((confirmation) => confirmation.signer.value === signer?.value)
    })
  }, [appSigners, detailedExecutionInfo])

  const proposedSigner = useMemo(() => {
    return availableSigners?.find((signer) =>
      detailedExecutionInfo?.signers?.some((executionSigner) => executionSigner.value === signer?.value),
    )
  }, [availableSigners, detailedExecutionInfo])

  const canSign = Boolean(proposedSigner && !hasSigned)

  return {
    activeSigner,
    activeTxSigner,
    appSigners,
    availableSigners,
    proposedSigner,
    hasSigned,
    canSign,
  }
}
