import { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectActiveSigner, setActiveSigner } from '@/src/store/activeSignerSlice'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { selectSigners, Signer } from '@/src/store/signersSlice'
import { RootState } from '@/src/store'

function isSignerStale(current: Signer | undefined, available: Signer[]): boolean {
  return current !== undefined && available.length > 0 && !available.some((s) => s.value === current.value)
}

function resolveActiveSigner(current: Signer | undefined, available: Signer[]): Signer | undefined {
  if (available.length === 0 || current === undefined) {
    return undefined
  }
  return available.find((s) => s.value === current.value)
}

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
    return (owners ?? [])
      .map((owner) => signers[owner.value])
      .filter((signer): signer is Signer => signer !== undefined)
  }, [owners, signers])

  const stale = isSignerStale(currentActiveSigner, availableSigners)
  const needsSignerUpdate = availableSigners.length > 0 && (!currentActiveSigner || stale)

  useEffect(() => {
    if (needsSignerUpdate) {
      dispatch(
        setActiveSigner({
          safeAddress: activeSafe.address,
          signer: availableSigners[0],
        }),
      )
    }
  }, [needsSignerUpdate, availableSigners, dispatch, activeSafe.address])

  const activeSigner = resolveActiveSigner(currentActiveSigner, availableSigners)

  return { activeSigner, availableSigners }
}
