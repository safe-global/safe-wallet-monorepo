import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature, useFeatureFlagRedirect, useRedirectWhenOff } from '@/features/spaces'
import { useIsSafeProAnnouncementEnabled } from '@/features/safe-pro-announcement'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useCurrentChain } from '@/hooks/useChains'
import { useLoadFeature } from '@/features/__core__'
import { AppRoutes } from '@/config/routes'

export default function SpacePlansPage() {
  const router = useRouter()
  const { spaceId } = router.query
  const spaces = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()
  const chain = useCurrentChain()
  const isAnnounced = useIsSafeProAnnouncementEnabled()
  const isSafePro = useIsSafeProEnabled()
  // Wait for the chain config: both flags read as off until it arrives.
  useRedirectWhenOff(chain ? isAnnounced || isSafePro : undefined, AppRoutes.spaces.index)

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Plans`}</title>
      </Head>

      <main>
        <spaces.SpacePlansPage spaceId={spaceId as string} />
      </main>
    </>
  )
}
