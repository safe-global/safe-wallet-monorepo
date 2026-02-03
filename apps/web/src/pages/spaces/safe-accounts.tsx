import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'

export default function SpaceAccountsPage() {
  const router = useRouter()
  const { spaceId } = router.query
  const spaces = useLoadFeature(SpacesFeature)

  if (!router.isReady || !spaceId || typeof spaceId !== 'string') return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Space Safe Accounts`}</title>
      </Head>

      <main>
        <spaces.AuthState spaceId={spaceId}>
          <AddressBookSourceProvider source="spaceOnly">
            <spaces.SpaceSafeAccounts />
          </AddressBookSourceProvider>
        </spaces.AuthState>
      </main>
    </>
  )
}
