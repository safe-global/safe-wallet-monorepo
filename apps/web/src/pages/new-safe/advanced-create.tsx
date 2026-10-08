import Head from 'next/head'
import type { NextPage } from 'next'

import AdvancedCreateSafe from '@/components/new-safe/create/AdvancedCreateSafe'
import { BRAND_NAME } from '@/config/constants'
import { NewSafePageView } from '@views/pages/new-safe/NewSafePageView'

const Open: NextPage = () => {
  return (
    <NewSafePageView>
      <Head>
        <title>{`${BRAND_NAME} – Advanced Safe creation`}</title>
      </Head>

      <AdvancedCreateSafe />
    </NewSafePageView>
  )
}

export default Open
