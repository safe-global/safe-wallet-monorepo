import { useEffect } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import useLastSafe from '@/hooks/useLastSafe'
import { AppRoutes } from '@/config/routes'
import { WC_URI_SEARCH_PARAM } from '@/features/walletconnect/hooks/useWalletConnectSearchParamUri'

const WcPage: NextPage = () => {
  const router = useRouter()
  const lastSafe = useLastSafe()

  useEffect(() => {
    if (!router.isReady || router.pathname !== AppRoutes.wc) {
      return
    }

    const { uri } = router.query

    router.replace(
      lastSafe
        ? {
            pathname: AppRoutes.home,
            query: {
              safe: lastSafe,
              [WC_URI_SEARCH_PARAM]: uri,
            },
          }
        : {
            pathname: AppRoutes.welcome.index,
            query: {
              [WC_URI_SEARCH_PARAM]: uri,
            },
          },
    )
  }, [router, lastSafe])

  return <></>
}

export default WcPage
