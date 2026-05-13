import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'

const SAFE_ROUTES = [
  AppRoutes.balances.index,
  AppRoutes.balances.nfts,
  AppRoutes.home,
  AppRoutes.settings.modules,
  AppRoutes.settings.setup,
  AppRoutes.swap,
  AppRoutes.transactions.index,
  AppRoutes.transactions.history,
  AppRoutes.transactions.messages,
  AppRoutes.transactions.queue,
  AppRoutes.transactions.tx,
]

// Replace %3A with : in the ?safe= parameter
// Redirect to index if a required safe parameter is missing
const useAdjustUrl = () => {
  const router = useRouter()

  useEffect(() => {
    const { asPath, isReady, query, pathname } = router

    const newPath = asPath.replace(/([?&]safe=.+?)%3A(?=0x)/g, '$1:')
    if (newPath !== asPath) {
      history.replaceState(history.state, '', newPath)
      return
    }

    // `?spaceId` is a valid deep link without `?safe` — defer to useSpaceIdSync,
    // which decides whether to bounce to sign-in or inject a Safe.
    if (isReady && !query.safe && !query.spaceId && SAFE_ROUTES.includes(pathname)) {
      router.replace({ pathname: AppRoutes.index })
    }
  }, [router])
}

export default useAdjustUrl
