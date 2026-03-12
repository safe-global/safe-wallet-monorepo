import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { AppRoutes } from '@/config/routes'
import useWallet from '@/hooks/wallets/useWallet'

const useInviteNavigation = () => {
  const router = useRouter()
  const wallet = useWallet()
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const spaceId = router.query.spaceId as string | undefined

  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace({ pathname: AppRoutes.welcome.createSpace })
    }
  }, [router, spaceId])

  const goBack = useCallback(() => {
    router.push({ pathname: AppRoutes.welcome.selectSafes, query: { spaceId } })
  }, [router, spaceId])

  const redirectToNextStep = useCallback(() => {
    router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
  }, [router, spaceId])

  const isReady = Boolean(wallet && isUserAuthenticated && spaceId)

  return {
    spaceId,
    isReady,
    goBack,
    redirectToNextStep,
  }
}

export default useInviteNavigation
