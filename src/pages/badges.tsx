import type { NextPage } from 'next'
import Head from 'next/head'

import Badges from '@/components/badges'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Super Account - Badges</title>
      </Head>

      <main>
        <Badges />
      </main>
    </>
  )
}

export default Home
