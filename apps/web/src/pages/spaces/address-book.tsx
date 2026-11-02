import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces/SpacesFeature'
import useFeatureFlagRedirect from '@/features/spaces/hooks/useFeatureFlagRedirect'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'

export default function SpaceAddressBookPage() {
  const router = useRouter()
  const { spaceId } = router.query
  const spaces = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Workspace address book`}</title>
      </Head>

      <main>
        <spaces.SpaceAddressBookPage spaceId={spaceId as string} />
      </main>
    </>
  )
}
