import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature, useFeatureFlagRedirect, useFeatureRedirect } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { PageMainView } from '@views/pages/PageMainView'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'

export default function SpacePoliciesPage() {
  const router = useRouter()
  const { spaceId } = router.query
  const { SpacePoliciesPage: FeatureSpacePoliciesPage } = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()
  useFeatureRedirect(FEATURES.POLICIES, AppRoutes.spaces.index)

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Policies`}</title>
      </Head>

      <PageMainView>
        <FeatureSpacePoliciesPage spaceId={spaceId as string} />
      </PageMainView>
    </>
  )
}
