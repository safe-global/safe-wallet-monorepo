import Head from 'next/head'
import { useRouter } from 'next/router'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces/SpacesFeature'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import useFeatureFlagRedirect from '@/features/spaces/hooks/useFeatureFlagRedirect'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'

export default function SpaceSettingsGeneralPage() {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  const spaces = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – General`}</title>
      </Head>

      <main>
        <spaces.SpaceSettingsPage spaceId={spaceId} activePage="general" />
      </main>
    </>
  )
}
