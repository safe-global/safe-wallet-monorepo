import { PendingSafeData } from '@/components/create-safe'
import { Dispatch, SetStateAction, useEffect } from 'react'
import { useRouter } from 'next/router'
import { pollSafeInfo } from '@/components/create-safe/status/usePendingSafeCreation'
import { AppRoutes } from '@/config/routes'
import { SafeCreationStatus } from '@/components/create-safe/status/useSafeCreation'
import useChainId from '@/hooks/useChainId'
import { trackEvent, CREATE_SAFE_EVENTS } from '@/services/analytics'

const useWatchSafeCreation = ({
  status,
  safeAddress,
  pendingSafe,
  setPendingSafe,
  setStatus,
}: {
  status: SafeCreationStatus
  safeAddress: string | undefined
  pendingSafe: PendingSafeData | undefined
  setPendingSafe: Dispatch<SetStateAction<PendingSafeData | undefined>>
  setStatus: Dispatch<SetStateAction<SafeCreationStatus>>
}) => {
  const router = useRouter()
  const chainId = useChainId()

  useEffect(() => {
    const checkCreatedSafe = async (chainId: string, address: string) => {
      try {
        await pollSafeInfo(chainId, address)
        setStatus(SafeCreationStatus.INDEXED)
      } catch (e) {
        setStatus(SafeCreationStatus.INDEX_FAILED)
      }
    }

    if (status === SafeCreationStatus.INDEXED) {
      trackEvent(CREATE_SAFE_EVENTS.GET_STARTED)

      safeAddress && router.push({ pathname: AppRoutes.safe.home, query: { safe: safeAddress } })
    }

    if (status === SafeCreationStatus.SUCCESS) {
      trackEvent(CREATE_SAFE_EVENTS.CREATED_SAFE)

      safeAddress && pendingSafe && checkCreatedSafe(chainId, safeAddress)
      setPendingSafe(undefined)
    }

    if (status === SafeCreationStatus.ERROR || status === SafeCreationStatus.REVERTED) {
      if (pendingSafe?.txHash) {
        setPendingSafe((prev) => (prev ? { ...prev, txHash: undefined } : undefined))
      }
    }
  }, [router, safeAddress, setPendingSafe, status, pendingSafe, setStatus, chainId])
}

export default useWatchSafeCreation
