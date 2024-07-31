import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { AppRoutes } from '@/config/routes'

const BookmarkedSafeApps: NextPage = () => {
  const router = useRouter()

  // Redirect to /apps
  useEffect(() => {
    router.replace({ pathname: AppRoutes.apps.index, query: { safe: router.query.safe } })
  }, [router])

  return (
    <Head>
      <title>{'Superchain Account – Safe Apps'}</title>
    </Head>
  )
}

export default BookmarkedSafeApps
