import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import useFeatureRedirect from '@/features/spaces/public/hooks/useFeatureRedirect'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import SpacePoliciesContent from '@/features/spaces/public/components/SpacePoliciesPage'

export default function SpacePoliciesPage() {
  const router = useRouter()
  const { spaceId } = router.query
  useFeatureRedirect(FEATURES.POLICIES, AppRoutes.spaces.index)

  if (!router.isReady || !spaceId) {
    return null
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Policies`}</title>
      </Head>

      <main>
        <SpacePoliciesContent spaceId={spaceId as string} />
      </main>
    </>
  )
}
