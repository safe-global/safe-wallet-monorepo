import Head from 'next/head'
import { useRouter } from 'next/router'
import { BRAND_NAME } from '@/config/constants'
import { useCurrentSpaceId } from '@/features/spaces/public/useCurrentSpaceId'
import useFeatureRedirect from '@/features/spaces/public/useFeatureRedirect'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import SpaceSettingsPage from '@/features/spaces/public/SpaceSettingsPage'

export default function SpaceSettingsExperimentalPage() {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  useFeatureRedirect(FEATURES.WORKSPACES_EXPERIMENTAL_FEATURES, AppRoutes.spaces.settingsGeneral)

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Experimental`}</title>
      </Head>

      <main>
        <SpaceSettingsPage spaceId={spaceId} activePage="experimental" />
      </main>
    </>
  )
}
