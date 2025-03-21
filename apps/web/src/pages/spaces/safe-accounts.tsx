import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import SpaceSafeAccounts from '@/features/spaces/components/SafeAccounts'
import AuthState from '@/features/spaces/components/AuthState'

export default function SpaceAccountsPage() {
  const router = useRouter()
  const { spaceId } = router.query

  if (!router.isReady || !spaceId || typeof spaceId !== 'string') return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Space Safe Accounts`}</title>
      </Head>

      <main>
        <AuthState spaceId={spaceId}>
          <SpaceSafeAccounts />
        </AuthState>
      </main>
    </>
  )
}
