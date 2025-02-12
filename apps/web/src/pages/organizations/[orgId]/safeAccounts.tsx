import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'

const SafeAccounts: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Organization safe accounts`}</title>
      </Head>

      <main>Safe accounts</main>
    </>
  )
}

export default SafeAccounts
