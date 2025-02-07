import Head from 'next/head'
import type { NextPage } from 'next'

import { BRAND_NAME } from '@/config/constants'
import CreateSafenetAccount from '@/features/safenet/components/new-safe/CreateSafenetSafe'

const Open: NextPage = () => {
  return (
    <main>
      <Head>
        <title>{`${BRAND_NAME} – Safenet Safe creation`}</title>
      </Head>

      <CreateSafenetAccount />
    </main>
  )
}

export default Open
