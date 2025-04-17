import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import SpaceSettings from 'src/features/spaces/components/SpaceSettings'
import AuthState from '@/features/spaces/components/AuthState'

export default function SpaceSettingsPage() {
  const router = useRouter()
  const { spaceId } = router.query

  if (!router.isReady || !spaceId || typeof spaceId !== 'string') return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Space settings`}</title>
      </Head>

      <main>
        <AuthState spaceId={spaceId}>
          <SpaceSettings />
        </AuthState>
      </main>
    </>
  )
}
