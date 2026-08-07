import { useEffect } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { getWelcomeRoute } from '@/utils/getWelcomeRoute'

// The standalone welcome/login screen has been replaced by the tabbed welcome
// (Workspaces + Trusted accounts). Keep this route as a redirect so existing
// bookmarks and deep links to /welcome still resolve.
const Welcome: NextPage = () => {
  const router = useRouter()
  const { chain } = router.query

  useEffect(() => {
    if (!router.isReady || router.pathname !== AppRoutes.welcome.index) {
      return
    }

    router.replace({
      pathname: getWelcomeRoute(),
      query: chain ? { chain } : undefined,
    })
  }, [router, chain])

  return <></>
}

export default Welcome
