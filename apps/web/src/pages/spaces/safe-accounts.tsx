import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import SpaceSafeAccountsPage from '@/features/spaces/public/components/SpaceSafeAccountsPage'

export default function SpaceAccountsPage() {
  const router = useRouter()
  const { spaceId } = router.query
  if (!router.isReady || !spaceId) {
    return null
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Workspace Safe accounts`}</title>
      </Head>

      <main>
        <SpaceSafeAccountsPage spaceId={spaceId as string} />
      </main>
    </>
  )
}
