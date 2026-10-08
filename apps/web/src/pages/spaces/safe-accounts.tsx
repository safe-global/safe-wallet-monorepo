import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature, useFeatureFlagRedirect } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { PageMainView } from '@views/pages/PageMainView'

export default function SpaceAccountsPage() {
  const router = useRouter()
  const { spaceId } = router.query
  const { SpaceSafeAccountsPage: FeatureSpaceSafeAccountsPage } = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Workspace Safe accounts`}</title>
      </Head>

      <PageMainView>
        <FeatureSpaceSafeAccountsPage spaceId={spaceId as string} />
      </PageMainView>
    </>
  )
}
