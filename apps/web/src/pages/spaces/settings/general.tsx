import Head from 'next/head'
import { useRouter } from 'next/router'
import { BRAND_NAME } from '@/config/constants'
import { useCurrentSpaceId } from '@/features/spaces/public/hooks/useCurrentSpaceId'
import SpaceSettingsPage from '@/features/spaces/public/components/SpaceSettingsPage'

export default function SpaceSettingsGeneralPage() {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  if (!router.isReady || !spaceId) {
    return null
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – General`}</title>
      </Head>

      <main>
        <SpaceSettingsPage spaceId={spaceId} activePage="general" />
      </main>
    </>
  )
}
