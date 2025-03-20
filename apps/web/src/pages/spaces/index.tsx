import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import SpaceDashboard from '@/features/spaces/components/Dashboard'
import AuthState from '@/features/spaces/components/AuthState'

export default function SpacePage() {
  const router = useRouter()
  const { spaceId } = router.query

  if (!router.isReady || !spaceId || typeof spaceId !== 'string') return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Space dashboard`}</title>
      </Head>

      <main>
        <AuthState spaceId={spaceId}>
          <SpaceDashboard />
        </AuthState>
      </main>
    </>
  )
}
