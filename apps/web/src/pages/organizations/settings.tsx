import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import OrgsSettings from '@/features/organizations/components/OrgsSettings'
import AuthState from '@/features/organizations/components/AuthState'

export default function OrganizationsSettingsPage() {
  const router = useRouter()
  const { orgId } = router.query

  if (!router.isReady || !orgId || typeof orgId !== 'string') return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Organization settings`}</title>
      </Head>

      <main>
        <AuthState orgId={orgId}>
          <OrgsSettings />
        </AuthState>
      </main>
    </>
  )
}
