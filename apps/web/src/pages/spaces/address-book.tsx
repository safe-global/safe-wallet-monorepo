import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature, useFeatureFlagRedirect } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { PageMainView } from '@views/pages/PageMainView'

export default function SpaceAddressBookPage() {
  const router = useRouter()
  const { spaceId } = router.query
  const { SpaceAddressBookPage: FeatureSpaceAddressBookPage } = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Workspace address book`}</title>
      </Head>

      <PageMainView>
        <FeatureSpaceAddressBookPage spaceId={spaceId as string} />
      </PageMainView>
    </>
  )
}
