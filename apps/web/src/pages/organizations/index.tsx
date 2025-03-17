import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import OrganizationsDashboard from '@/features/organizations/components/Dashboard'
import AuthState from '@/features/organizations/components/AuthState'

export default function OrganizationPage() {
  const router = useRouter()
  const { orgId } = router.query

  if (!router.isReady || !orgId || typeof orgId !== 'string') return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Organization dashboard`}</title>
      </Head>

      <main>
        <AuthState orgId={orgId}>
          <OrganizationsDashboard />
        </AuthState>
      </main>
    </>
  )
}
