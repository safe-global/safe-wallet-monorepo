import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces/SpacesFeature'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'
import useSecurityHubFeatureRedirect from '@/features/security/hooks/useSecurityHubFeatureRedirect'

export default function SpaceSecurityPage() {
  const router = useRouter()
  const { spaceId } = router.query
  const spaces = useLoadFeature(SpacesFeature)
  useSecurityHubFeatureRedirect()

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Security hub`}</title>
      </Head>

      <main>
        <spaces.SecurityHubPage spaceId={spaceId as string} />
      </main>
    </>
  )
}
