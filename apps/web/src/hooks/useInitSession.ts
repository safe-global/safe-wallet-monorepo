import { useAppDispatch } from '@/store'
import { setLastChainId, setLastSafeAddress } from '@/store/sessionSlice'
import { useEffect } from 'react'
import { useUrlChain } from './useChainId'
import useSafeInfo from './useSafeInfo'

export const useInitSession = (): void => {
  const dispatch = useAppDispatch()
  const urlChain = useUrlChain()
  const chainId = urlChain.status === 'resolved' ? urlChain.chainId : undefined
  // N.B. only successfully loaded Safes, don't use useSafeAddress() here!
  const { safe, safeAddress } = useSafeInfo()

  useEffect(() => {
    if (chainId) {
      dispatch(setLastChainId(chainId))
    }
  }, [dispatch, chainId])

  useEffect(() => {
    if (!safeAddress) return

    dispatch(
      setLastSafeAddress({
        // This chainId isn't necessarily the same as the current chainId
        chainId: safe.chainId,
        safeAddress,
      }),
    )
  }, [dispatch, safe.chainId, safeAddress])
}
