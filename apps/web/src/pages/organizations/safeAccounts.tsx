import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import OrganizationSafeAccounts from '@/features/organizations/components/SafeAccounts'
import AuthState from '@/features/organizations/components/AuthState'

export default function OrganizationsSafeAccountsPage() {
  const router = useRouter()
  const { orgId } = router.query

  if (!router.isReady || !orgId || typeof orgId !== 'string') return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Organization Safe Accounts`}</title>
      </Head>

      <main>
        <AuthState orgId={orgId}>
          <OrganizationSafeAccounts />
        </AuthState>
      </main>
    </>
  )
}
