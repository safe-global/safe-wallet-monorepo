import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { BRAND_NAME } from '@/config/constants'

const WelcomeSignIn = dynamic(() => import('@/features/spaces/components/WelcomeSignIn'), { ssr: false })

const Spaces: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Welcome`}</title>
      </Head>

      <WelcomeSignIn />
    </>
  )
}

export default Spaces
