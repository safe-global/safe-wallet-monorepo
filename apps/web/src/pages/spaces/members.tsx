import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import SpaceMembersContent from '@/features/spaces/public/components/SpaceMembersPage'

export default function SpaceMembersPage() {
  const router = useRouter()
  const { spaceId } = router.query
  if (!router.isReady || !spaceId) return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Workspace members`}</title>
      </Head>

      <main>
        <SpaceMembersContent spaceId={spaceId as string} />
      </main>
    </>
  )
}
