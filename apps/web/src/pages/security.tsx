import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import SafeSecurityView from '@/features/security/components/SafeSecurityView'

const SecurityPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Security`}</title>
      </Head>

      <main>
        <SafeSecurityView />
      </main>
    </>
  )
}

export default SecurityPage
