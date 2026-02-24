import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated, setLastUsedSpace } from '@/store/authSlice'
import { AppRoutes } from '@/config/routes'
import useWallet from '@/hooks/wallets/useWallet'

const useOnboardingNavigation = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const spaceId = router.query.spaceId as string | undefined

  useEffect(() => {
    if (spaceId) {
      dispatch(setLastUsedSpace(spaceId))
    }
  }, [spaceId, dispatch])

  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace({ pathname: AppRoutes.welcome.createSpace })
    }
  }, [router, spaceId])

  const handleBack = useCallback(() => {
    router.push({ pathname: AppRoutes.welcome.createSpace })
  }, [router])

  const handleSkip = useCallback(() => {
    router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
  }, [router, spaceId])

  const redirectToNextStep = useCallback(() => {
    router.push({ pathname: AppRoutes.welcome.inviteMembers, query: { spaceId } })
  }, [router, spaceId])

  const isReady = Boolean(wallet && isUserAuthenticated && spaceId)

  return {
    spaceId,
    isReady,
    handleBack,
    handleSkip,
    redirectToNextStep,
  }
}

export default useOnboardingNavigation
