import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import SpaceSettings from 'src/features/spaces/components/SpaceSettings'
import AuthState from '@/features/spaces/components/AuthState'
import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'

export default function SpaceSettingsPage() {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()

  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Space settings`}</title>
      </Head>

      <main>
        <AuthState spaceId={spaceId}>
          <AddressBookSourceProvider source="spaceOnly">
            <SpaceSettings />
          </AddressBookSourceProvider>
        </AuthState>
      </main>
    </>
  )
}
