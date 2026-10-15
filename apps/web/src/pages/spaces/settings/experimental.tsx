import Head from 'next/head'
import { useRouter } from 'next/router'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature, useCurrentSpaceId, useFeatureFlagRedirect } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

export default function SpaceSettingsExperimentalPage() {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  const spaces = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Experimental`}</title>
      </Head>

      <main>
        <spaces.SpaceSettingsPage spaceId={spaceId} activePage="experimental" />
      </main>
    </>
  )
}
