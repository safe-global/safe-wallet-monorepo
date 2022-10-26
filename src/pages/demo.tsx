import type { NextPage } from 'next'
import Head from 'next/head'
import CreateSafe from '@/components/open/CreateSafe'

const Open: NextPage = () => {
  return (
    <main>
      <Head>
        <title>Safe – Create Safe</title>
      </Head>

      <CreateSafe />
    </main>
  )
}

export default Open
