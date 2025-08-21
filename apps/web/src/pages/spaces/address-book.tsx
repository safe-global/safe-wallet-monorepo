import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import AuthState from '@/features/spaces/components/AuthState'
import SpaceAddressBook from '@/features/spaces/components/SpaceAddressBook'

export default function SpaceSettingsPage() {
  const router = useRouter()
  const { spaceId } = router.query

  if (!router.isReady || !spaceId || typeof spaceId !== 'string') return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Space address book`}</title>
      </Head>

      <main>
        <AuthState spaceId={spaceId}>
          <SpaceAddressBook />
        </AuthState>
      </main>
    </>
  )
}
