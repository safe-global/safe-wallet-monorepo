import { useEffect } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { getWelcomeRoute } from '@/utils/getWelcomeRoute'

const IndexPage: NextPage = () => {
  const router = useRouter()
  const { chain } = router.query

  useEffect(() => {
    if (!router.isReady || router.pathname !== AppRoutes.index) {
      return
    }

    // Both tabbed welcome landing pages are public — no login gate.
    router.replace({
      pathname: getWelcomeRoute(),
      query: chain ? { chain } : undefined,
    })
  }, [router, chain])

  return <></>
}

export default IndexPage
