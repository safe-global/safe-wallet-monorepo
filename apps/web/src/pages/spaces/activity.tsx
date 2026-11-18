import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import useFeatureRedirect from '@/features/spaces/public/hooks/useFeatureRedirect'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import SpaceActivityLogPage from '@/features/spaces/public/components/SpaceActivityLogPage'

export default function SpaceActivityPage() {
  const router = useRouter()
  const { spaceId } = router.query
  useFeatureRedirect(FEATURES.SPACE_AUDIT_LOG, AppRoutes.spaces.index)

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Activity`}</title>
      </Head>

      <main>
        <SpaceActivityLogPage spaceId={spaceId as string} />
      </main>
    </>
  )
}
