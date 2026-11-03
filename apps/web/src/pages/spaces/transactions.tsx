import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces/SpacesFeature'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import useFeatureFlagRedirect from '@/features/spaces/hooks/useFeatureFlagRedirect'
import useFeatureRedirect from '@/features/spaces/hooks/useFeatureRedirect'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'

export default function SpaceTransactionsPage() {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  const spaces = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()
  useFeatureRedirect(FEATURES.SPACE_TRANSACTIONS, AppRoutes.spaces.index)

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Transactions`}</title>
      </Head>

      <main>
        <spaces.SpaceTransactionsPage spaceId={spaceId} />
      </main>
    </>
  )
}
