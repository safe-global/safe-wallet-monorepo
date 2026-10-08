import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { OfflineView } from '@views/pages/OfflineView'

const Offline: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Offline`}</title>
      </Head>

      <OfflineView />
    </>
  )
}

export default Offline
