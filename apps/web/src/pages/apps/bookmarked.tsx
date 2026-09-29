import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { AppRoutes } from '@/config/routes'
import { BRAND_NAME } from '@/config/constants'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'

const BookmarkedSafeApps: NextPage = () => {
  const router = useRouter()
  const safeLinkQuery = useSafeLinkQuery()

  // Redirect to /apps
  useEffect(() => {
    router.replace({ pathname: AppRoutes.apps.index, query: safeLinkQuery })
  }, [router, safeLinkQuery])

  return (
    <Head>
      <title>{`${BRAND_NAME} – Safe Apps`}</title>
    </Head>
  )
}

export default BookmarkedSafeApps
