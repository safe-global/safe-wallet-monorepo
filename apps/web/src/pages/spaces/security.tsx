import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import useSecurityHubFeatureRedirect from '@/features/security/public/hooks/useSecurityHubFeatureRedirect'
import SecurityHubPage from '@/features/spaces/public/components/SecurityHubPage'

export default function SpaceSecurityPage() {
  const router = useRouter()
  const { spaceId } = router.query
  useSecurityHubFeatureRedirect()

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Security hub`}</title>
      </Head>

      <main>
        <SecurityHubPage spaceId={spaceId as string} />
      </main>
    </>
  )
}
