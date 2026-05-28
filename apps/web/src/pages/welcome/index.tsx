import { useEffect } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import NewSafe from '@/components/welcome/NewSafe'
import { BRAND_NAME } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'

const Welcome: NextPage = () => {
  const router = useRouter()
  const isRequireLoginEnabled = useIsRequireLoginEnabled()

  useEffect(() => {
    if (!router.isReady || router.pathname !== AppRoutes.welcome.index) return
    if (isRequireLoginEnabled !== true) return
    // Preserve any context the user was carrying (next=, safe=, chain=, tracking
    // params); /welcome/spaces is the canonical landing for the gate, and the
    // route guard / sign-in flow rely on those round-tripping intact.
    router.replace({ pathname: AppRoutes.welcome.spaces, query: router.query })
  }, [router, isRequireLoginEnabled])

  // Keep the page blank while the gate flag is loading too — otherwise the
  // legacy welcome UI flashes for ~100ms before we know whether to redirect.
  if (isRequireLoginEnabled !== false) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Welcome`}</title>
      </Head>

      <NewSafe />
    </>
  )
}

export default Welcome
