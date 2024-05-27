import type { NextPage } from 'next'
import Head from 'next/head'
import NewSafe from '@/components/welcome/NewSafe'
import useCurrentWalletHasSuperChainSmartAccount from '@/hooks/super-chain/useCurrentWalletHasSuperChainSmartAccount'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

const Welcome: NextPage = () => {
  const { hasSuperChainSmartAccount, superChainSmartAccount } = useCurrentWalletHasSuperChainSmartAccount()
  const router = useRouter()
  useEffect(() => {
    if (hasSuperChainSmartAccount) {
      router.push({
        pathname: '/home',
        query: { safe: superChainSmartAccount },
      })
    }
  }, [hasSuperChainSmartAccount])

  return (
    <>
      <Head>
        <title>SuperChain Smart Accounts – Welcome</title>
      </Head>

      <NewSafe />
    </>
  )
}

export default Welcome
