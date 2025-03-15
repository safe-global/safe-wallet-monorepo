import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import OrganizationMembers from '@/features/organizations/components/Members'
import AuthState from '@/features/organizations/components/AuthState'

export default function OrganizationsMembersPage() {
  const router = useRouter()
  const { orgId } = router.query

  if (!router.isReady || !orgId || typeof orgId !== 'string') return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Organization members`}</title>
      </Head>

      <main>
        <AuthState orgId={orgId}>
          <OrganizationMembers />
        </AuthState>
      </main>
    </>
  )
}
