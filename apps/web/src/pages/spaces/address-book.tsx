import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import SpaceAddressBookContent from '@/features/spaces/public/components/SpaceAddressBookPage'

export default function SpaceAddressBookPage() {
  const router = useRouter()
  const { spaceId } = router.query
  if (!router.isReady || !spaceId) {
    return null
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Workspace address book`}</title>
      </Head>

      <main>
        <SpaceAddressBookContent spaceId={spaceId as string} />
      </main>
    </>
  )
}
