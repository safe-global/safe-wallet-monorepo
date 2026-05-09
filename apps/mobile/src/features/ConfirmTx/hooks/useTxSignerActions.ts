import { useCallback } from 'react'
import { setActiveSigner } from '@/src/store/activeSignerSlice'
import { useAppDispatch } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { SignerInfo } from '@/src/types/address'

export const useTxSignerActions = () => {
  const dispatch = useAppDispatch()
  const activeSafe = useDefinedActiveSafe()

  const setTxSigner = useCallback(
    (signer: SignerInfo) => {
      dispatch(setActiveSigner({ safeAddress: activeSafe.address, signer }))
    },
    [dispatch, activeSafe.address],
  )

  return {
    setTxSigner,
  }
}
