import { useEffect } from 'react'
import Head from 'next/head'
import { FEATURES } from '@safe-global/safe-gateway-typescript-sdk'
import { useRouter } from 'next/router'
import type { NextPage } from 'next'

import PaginatedMsgs from '@/components/safe-messages/PaginatedMsgs'
import TxHeader from '@/components/transactions/TxHeader'
import SignedMessagesHelpLink from '@/components/transactions/SignedMessagesHelpLink'
import { AppRoutes } from '@/config/routes'
import { useCurrentChain } from '@/hooks/useChains'
import { hasFeature } from '@/utils/chains'

const Messages: NextPage = () => {
  const chain = useCurrentChain()
  const router = useRouter()

  useEffect(() => {
    if (!chain || hasFeature(chain, FEATURES.EIP1271)) {
      return
    }

    router.replace({ ...router, pathname: AppRoutes.transactions.history })
  }, [router, chain])

  return (
    <>
      <Head>
        <title>{'Superchain Account – Messages'}</title>
      </Head>

      <TxHeader>
        <SignedMessagesHelpLink />
      </TxHeader>

      <main>
        <PaginatedMsgs />
      </main>
    </>
  )
}

export default Messages
