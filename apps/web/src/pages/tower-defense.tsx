import type { NextPage } from 'next'
import Head from 'next/head'
import TowerDefense from '@/features/tower-defense'
import { BRAND_NAME } from '@/config/constants'

const TowerDefensePage: NextPage = () => (
  <>
    <Head>
      <title>{`${BRAND_NAME} – Safe{Defense}`}</title>
    </Head>
    <TowerDefense />
  </>
)

export default TowerDefensePage
