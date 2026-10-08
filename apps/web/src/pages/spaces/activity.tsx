import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature, useFeatureFlagRedirect, useFeatureRedirect } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { PageMainView } from '@views/pages/PageMainView'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'

export default function SpaceActivityPage() {
  const router = useRouter()
  const { spaceId } = router.query
  const { SpaceActivityLogPage: FeatureSpaceActivityLogPage } = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()
  useFeatureRedirect(FEATURES.SPACE_AUDIT_LOG, AppRoutes.spaces.index)

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Activity`}</title>
      </Head>

      <PageMainView>
        <FeatureSpaceActivityLogPage spaceId={spaceId as string} />
      </PageMainView>
    </>
  )
}
