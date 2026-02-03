import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SpaceMembers from './index'

export default function SpaceMembersPage() {
  const router = useRouter()
  const { spaceId } = router.query

  if (!router.isReady || !spaceId || typeof spaceId !== 'string') return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Space members`}</title>
      </Head>

      <main>
        <AuthState spaceId={spaceId}>
          <AddressBookSourceProvider source="spaceOnly">
            <SpaceMembers />
          </AddressBookSourceProvider>
        </AuthState>
      </main>
    </>
  )
}
