import type { NextPage } from 'next'
import Head from 'next/head'
import CreateSafe from '@/components/create-safe'

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
