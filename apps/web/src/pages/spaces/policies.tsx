import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces/SpacesFeature'
import useFeatureFlagRedirect from '@/features/spaces/hooks/useFeatureFlagRedirect'
import useFeatureRedirect from '@/features/spaces/hooks/useFeatureRedirect'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'

export default function SpacePoliciesPage() {
  const router = useRouter()
  const { spaceId } = router.query
  const spaces = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()
  useFeatureRedirect(FEATURES.POLICIES, AppRoutes.spaces.index)

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Policies`}</title>
      </Head>

      <main>
        <spaces.SpacePoliciesPage spaceId={spaceId as string} />
      </main>
    </>
  )
}
