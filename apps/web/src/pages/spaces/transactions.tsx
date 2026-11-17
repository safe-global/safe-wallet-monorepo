import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { useCurrentSpaceId } from '@/features/spaces/public/useCurrentSpaceId'
import useFeatureRedirect from '@/features/spaces/public/useFeatureRedirect'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import SpaceTransactionsContent from '@/features/spaces/public/SpaceTransactionsPage'

export default function SpaceTransactionsPage() {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  useFeatureRedirect(FEATURES.SPACE_TRANSACTIONS, AppRoutes.spaces.index)

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Transactions`}</title>
      </Head>

      <main>
        <SpaceTransactionsContent spaceId={spaceId} />
      </main>
    </>
  )
}
