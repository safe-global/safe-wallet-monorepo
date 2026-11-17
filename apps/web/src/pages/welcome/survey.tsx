import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { BRAND_NAME } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import useIsSurveyEnabled from '@/hooks/useIsSurveyEnabled'
import SurveyOnboarding from '@/features/spaces/public/components/SurveyOnboarding'

const SurveyPage = () => {
  const router = useRouter()
  const isEnabled = useIsSurveyEnabled()

  // Dead-end safety net: only redirect once we have a definitive `false`.
  // Hold off while chain config is still loading (`undefined`) so users
  // don't get bounced away before we know the survey is actually disabled.
  useEffect(() => {
    if (!router.isReady || isEnabled !== false) return
    const spaceId = router.query.spaceId as string | undefined
    router.replace(
      spaceId ? { pathname: AppRoutes.spaces.index, query: { spaceId } } : { pathname: AppRoutes.welcome.createSpace },
    )
  }, [router, isEnabled])

  if (isEnabled !== true) return null

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
