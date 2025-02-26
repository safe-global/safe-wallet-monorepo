import { useEffect, useMemo } from 'react'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { selectActiveSigner, setActiveSigner } from '@/src/store/activeSignerSlice'
import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { extractAppSigners } from '../../utils'
import { selectSigners } from '@/src/store/signersSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

export const useTxSigner = (detailedExecutionInfo?: MultisigExecutionDetails) => {
  const activeSafe = useDefinedActiveSafe()
  const activeSigner = useAppSelector((state: RootState) => selectActiveSigner(state, activeSafe.address))
  const signers = useAppSelector(selectSigners)
  const dispatch = useAppDispatch()

  const appSigners = extractAppSigners(signers, detailedExecutionInfo)
  const activeTxSigner = useMemo(
    () => appSigners.find((signer) => signer.value === activeSigner?.value),
    [appSigners, activeSigner],
  )

  // Changes the active signer if there are app signers and the active signer is not in the app signers
  // because it can be a signer of that safe but in a different chain
  useEffect(() => {
    if (appSigners.length > 0 && !activeTxSigner) {
      dispatch(setActiveSigner({ safeAddress: activeSafe.address, signer: appSigners[0] }))
    }
  }, [activeTxSigner, appSigners])

  return activeSigner
}
