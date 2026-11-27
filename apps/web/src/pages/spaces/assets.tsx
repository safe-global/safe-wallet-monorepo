import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { useCurrentSpaceId } from '@/features/spaces/public/hooks/useCurrentSpaceId'
import useFeatureRedirect from '@/features/spaces/public/hooks/useFeatureRedirect'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import SpaceAssetsContent from '@/features/spaces/public/components/SpaceAssetsPage'

export default function SpaceAssetsPage() {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  useFeatureRedirect(FEATURES.SPACE_ASSETS, AppRoutes.spaces.index)

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Assets`}</title>
      </Head>

      <main>
        <SpaceAssetsContent spaceId={spaceId} />
      </main>
    </>
  )
}
