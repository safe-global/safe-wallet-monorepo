import type { NextPage } from 'next'
import Head from 'next/head'
import SafeImprint from '@/components/imprint'
import { IS_OFFICIAL_HOST } from '@/config/constants'

const Imprint: NextPage = () => {
  return (
    <>
      <Head>
        <title>{'BNB Safe{Wallet} – Imprint'}</title>
      </Head>

      <main>{IS_OFFICIAL_HOST && <SafeImprint />}</main>
    </>
  )
}

export default Imprint
