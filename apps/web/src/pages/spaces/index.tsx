import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature, useFeatureFlagRedirect, useLandingSpaceId } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { AppRoutes } from '@/config/routes'
import { parseSpaceId } from '@/hooks/useUrlSpaceId'

export default function SpacePage() {
  const router = useRouter()
  const spaceId = parseSpaceId(router.query.spaceId)
  const spaces = useLoadFeature(SpacesFeature)
  const landing = useLandingSpaceId()
  useFeatureFlagRedirect()

  useEffect(() => {
    if (!router.isReady || spaceId || landing.isLoading) return

    // Preserve any context the user was carrying (e.g. ?safe=, ?chain=, tracking params)
    if (landing.spaceId) {
      router.replace({ pathname: AppRoutes.spaces.index, query: { ...router.query, spaceId: landing.spaceId } })
    } else {
      router.replace({ pathname: AppRoutes.welcome.spaces, query: router.query })
    }
  }, [router, spaceId, landing.isLoading, landing.spaceId])

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Workspace dashboard`}</title>
      </Head>

      <main className="!pt-0">
        <spaces.SpaceDashboardPage spaceId={spaceId} />
      </main>
    </>
  )
}
