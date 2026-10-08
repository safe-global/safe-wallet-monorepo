import type { NextPage } from 'next'
import Head from 'next/head'

import Dashboard from '@/components/dashboard'
import { BRAND_NAME } from '@/config/constants'
import { PageMainView } from '@views/pages/PageMainView'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Dashboard`}</title>
      </Head>

      <PageMainView>
        <Dashboard />
      </PageMainView>
    </>
  )
}

export default Home
