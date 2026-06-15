import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { AppRoutes } from '@/config/routes'

export default function SpaceSettingsIndexPage() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    router.replace({ pathname: AppRoutes.spaces.settingsGeneral, query: router.query })
  }, [router])

  return (
    <Head>
      <title>{`${BRAND_NAME} – Workspace Settings`}</title>
    </Head>
  )
}
