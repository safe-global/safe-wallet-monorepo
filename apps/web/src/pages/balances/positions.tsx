import type { NextPage } from 'next'
import Head from 'next/head'

import AssetsHeader from '@/components/balances/AssetsHeader'
import AssetsSettingsButton from '@/components/balances/AssetsSettingsButton'
import CurrencySelect from '@/components/balances/CurrencySelect'
import { BRAND_NAME } from '@/config/constants'
import dynamic from 'next/dynamic'

const DefiPositions = dynamic(() => import('@/features/positions'))

const Positions: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Assets`}</title>
      </Head>

      <AssetsHeader>
        <AssetsSettingsButton />
        <CurrencySelect />
      </AssetsHeader>

      <main>
        <DefiPositions />
      </main>
    </>
  )
}

export default Positions
