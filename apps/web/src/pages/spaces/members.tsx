import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature, useFeatureFlagRedirect, useAuthRedirect } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

export default function SpaceMembersPage() {
  const router = useRouter()
  const { spaceId } = router.query
  const spaces = useLoadFeature(SpacesFeature)
  useFeatureFlagRedirect()
  useAuthRedirect()

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Space members`}</title>
      </Head>

      <main>
        <spaces.SpaceMembersPage spaceId={spaceId as string} />
      </main>
    </>
  )
}
