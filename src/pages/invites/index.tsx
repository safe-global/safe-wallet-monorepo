import AcceptInvite from '@/components/accept-invite'
import type { NextPage } from 'next'
import Head from 'next/head'
const Invites: NextPage = () => {
  return (
    <main>
      <Head>
        <title>SuperChain Smart Accounts – Accept invite</title>
      </Head>
      <AcceptInvite />
    </main>
  )
}

export default Invites
