import { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectActiveSigner, setActiveSigner } from '@/src/store/activeSignerSlice'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { selectSigners, Signer } from '@/src/store/signersSlice'
import { RootState } from '@/src/store'

export function useEnsureActiveSigner() {
  const dispatch = useAppDispatch()
  const activeSafe = useDefinedActiveSafe()
  const owners = useAppSelector((state: RootState) => {
    const chainSafe = selectSafeInfo(state, activeSafe.address)?.[activeSafe.chainId]
    return chainSafe?.owners
  })
  const signers = useAppSelector(selectSigners)
  const currentActiveSigner = useAppSelector((state: RootState) => selectActiveSigner(state, activeSafe.address))

  const availableSigners: Signer[] = useMemo(() => {
    if (!owners) {
      return []
    }
    return owners.map((owner) => signers[owner.value]).filter((signer): signer is Signer => signer !== undefined)
  }, [owners, signers])

  const isSignerStale =
    currentActiveSigner !== undefined &&
    availableSigners.length > 0 &&
    !availableSigners.some((s) => s.value === currentActiveSigner.value)

  useEffect(() => {
    if (availableSigners.length === 0) {
      return
    }
    if (!currentActiveSigner || isSignerStale) {
      dispatch(
        setActiveSigner({
          safeAddress: activeSafe.address,
          signer: availableSigners[0],
        }),
      )
    }
  }, [currentActiveSigner, isSignerStale, availableSigners, dispatch, activeSafe.address])

  const activeSigner = isSignerStale ? undefined : currentActiveSigner

  return { activeSigner, availableSigners }
}
