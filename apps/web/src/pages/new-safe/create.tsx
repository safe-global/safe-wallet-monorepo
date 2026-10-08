import Head from 'next/head'
import type { NextPage } from 'next'

import CreateSafe from '@/components/new-safe/create'
import { BRAND_NAME } from '@/config/constants'
import { NewSafePageView } from '@views/pages/new-safe/NewSafePageView'
import { AppRoutes } from '@/config/routes'
import { useCurrentSpaceId } from '@/features/spaces'

const Open: NextPage = () => {
  const spaceId = useCurrentSpaceId()
  const logoHref = spaceId ? `${AppRoutes.spaces.index}?spaceId=${spaceId}` : AppRoutes.index

  return (
    <NewSafePageView logoHref={logoHref}>
      <Head>
        <title>{`${BRAND_NAME} – Create Safe account`}</title>
      </Head>

      <CreateSafe />
    </NewSafePageView>
  )
}

export default Open
