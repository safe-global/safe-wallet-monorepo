import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import type { NextPage } from 'next'

import PaginatedMsgs from '@/components/safe-messages/PaginatedMsgs'
import TxHeader from '@/components/transactions/TxHeader'
import SignedMessagesHelpLink from '@/components/transactions/SignedMessagesHelpLink'
import { AppRoutes } from '@/config/routes'
import { useCurrentChain } from '@/hooks/useChains'
import { BRAND_NAME } from '@/config/constants'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { PageMainView } from '@views/pages/PageMainView'

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
        <title>{`${BRAND_NAME} – Messages`}</title>
      </Head>

      <TxHeader>
        <SignedMessagesHelpLink />
      </TxHeader>

      <PageMainView>
        <PaginatedMsgs />
      </PageMainView>
    </>
  )
}

export default Messages
