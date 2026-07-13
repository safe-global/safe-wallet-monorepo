import Head from 'next/head'
import type { NextPage } from 'next'

import CreateSafe from '@/components/new-safe/create'
import { BRAND_NAME } from '@/config/constants'
import SafeLogo from '@/components/common/SafeLogo'
import { AppRoutes } from '@/config/routes'
import { useCurrentSpaceId } from '@/features/spaces'

const Open: NextPage = () => {
  const spaceId = useCurrentSpaceId()
  const logoHref = spaceId ? `${AppRoutes.spaces.index}?spaceId=${spaceId}` : AppRoutes.welcome.index

  return (
    <main>
      <div className="fixed top-0 left-0 z-[1300] flex items-center px-6" style={{ height: 'var(--header-height)' }}>
        <SafeLogo href={logoHref} />
      </div>
      <Head>
        <title>{`${BRAND_NAME} – Create Safe account`}</title>
      </Head>

      <CreateSafe />
    </main>
  )
}

export default Open
