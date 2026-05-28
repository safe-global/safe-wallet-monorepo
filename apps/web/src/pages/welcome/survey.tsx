import { useEffect } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { BRAND_NAME, IS_SURVEY_ONBOARDING_ENABLED } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

const SurveyPage: NextPage = () => {
  const router = useRouter()
  const { SurveyOnboarding } = useLoadFeature(SpacesFeature)

  // Dead-end safety net when the flag is off: direct URL / bookmark visits
  // would otherwise land on a blank page since SurveyOnboarding is unmounted.
  useEffect(() => {
    if (!router.isReady || IS_SURVEY_ONBOARDING_ENABLED) return
    const spaceId = router.query.spaceId as string | undefined
    router.replace(
      spaceId ? { pathname: AppRoutes.spaces.index, query: { spaceId } } : { pathname: AppRoutes.welcome.createSpace },
    )
  }, [router])

  if (!IS_SURVEY_ONBOARDING_ENABLED) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – How will you use Safe?`}</title>
      </Head>

      <SurveyOnboarding />
    </>
  )
}

export default SurveyPage
