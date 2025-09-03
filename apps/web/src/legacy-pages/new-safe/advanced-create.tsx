import Head from 'next/head'
import type { NextPage } from 'next'

import AdvancedCreateSafe from '@/components/new-safe/create/AdvancedCreateSafe'
import { BRAND_NAME } from '@/config/constants'

const Open: NextPage = () => {
  return (
    <main>
      <Head>
        <title>{`${BRAND_NAME} – Advanced Safe creation`}</title>
      </Head>

      <AdvancedCreateSafe />
    </main>
  )
}

export default Open
