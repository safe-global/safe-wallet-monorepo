import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { AppRoutes } from '@/config/routes'
import { BRAND_NAME } from '@/config/constants'
import { useSpaceIdQuery } from '@/hooks/useUrlSpaceId'

const BookmarkedSafeApps: NextPage = () => {
  const router = useRouter()
  const spaceIdQuery = useSpaceIdQuery()

  // Redirect to /apps
  useEffect(() => {
    router.replace({ pathname: AppRoutes.apps.index, query: { safe: router.query.safe, ...spaceIdQuery } })
  }, [router, spaceIdQuery])

  return (
    <Head>
      <title>{`${BRAND_NAME} – Safe Apps`}</title>
    </Head>
  )
}

export default BookmarkedSafeApps
