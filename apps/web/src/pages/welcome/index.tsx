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
    if (!router.isReady || isRequireLoginEnabled !== true) return
    router.replace(AppRoutes.welcome.spaces)
  }, [router, isRequireLoginEnabled])

  if (isRequireLoginEnabled) return null

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
