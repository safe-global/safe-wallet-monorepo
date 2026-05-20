import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature, useFeatureFlagRedirect } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { AppRoutes } from '@/config/routes'

export default function SpacePage() {
  const router = useRouter()
  const { spaceId } = router.query
  const spaces = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()

  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace(AppRoutes.welcome.spaces)
    }
  }, [router, spaceId])

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Space dashboard`}</title>
      </Head>

      <main>
        <spaces.SpaceDashboardPage spaceId={spaceId as string} />
      </main>
    </>
  )
}
