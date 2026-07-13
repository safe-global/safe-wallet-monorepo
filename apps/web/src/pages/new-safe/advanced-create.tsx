import Head from 'next/head'
import type { NextPage } from 'next'

import AdvancedCreateSafe from '@/components/new-safe/create/AdvancedCreateSafe'
import { BRAND_NAME } from '@/config/constants'
import SafeLogo from '@/components/common/SafeLogo'

const Open: NextPage = () => {
  return (
    <main>
      <div className="fixed top-0 left-0 z-[1300] flex items-center px-6" style={{ height: 'var(--header-height)' }}>
        <SafeLogo />
      </div>
      <Head>
        <title>{`${BRAND_NAME} – Advanced Safe creation`}</title>
      </Head>

      <AdvancedCreateSafe />
    </main>
  )
}

export default Open
