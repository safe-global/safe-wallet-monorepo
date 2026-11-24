import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { useRedirectWhenOff } from '@/features/spaces/public/hooks/useFeatureRedirect'
import { useIsSafeProAnnouncementEnabled } from '@/features/safe-pro-announcement/public/hooks/useIsSafeProAnnouncementEnabled'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useCurrentChain } from '@/hooks/useChains'
import { AppRoutes } from '@/config/routes'
import SpacePlansContent from '@/features/spaces/public/components/SpacePlansPage'

export default function SpacePlansPage() {
  const router = useRouter()
  const { spaceId } = router.query
  const chain = useCurrentChain()
  const isAnnounced = useIsSafeProAnnouncementEnabled()
  const isSafePro = useIsSafeProEnabled()
  // Wait for the chain config: both flags read as off until it arrives.
  useRedirectWhenOff(chain ? isAnnounced || isSafePro : undefined, AppRoutes.spaces.index)

  if (!router.isReady || !spaceId) {
    return null
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Plans`}</title>
      </Head>

      <main>
        <SpacePlansContent spaceId={spaceId as string} />
      </main>
    </>
  )
}
