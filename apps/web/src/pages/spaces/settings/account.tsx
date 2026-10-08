import Head from 'next/head'
import { useRouter } from 'next/router'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature, useCurrentSpaceId, useFeatureFlagRedirect } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { PageMainView } from '@views/pages/PageMainView'

const ACTIVE_PAGE = 'account'

export default function SpaceSettingsAccountPage() {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  const { SpaceSettingsPage: FeatureSpaceSettingsPage } = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Account`}</title>
      </Head>

      <PageMainView>
        <FeatureSpaceSettingsPage spaceId={spaceId} activePage={ACTIVE_PAGE} />
      </PageMainView>
    </>
  )
}
