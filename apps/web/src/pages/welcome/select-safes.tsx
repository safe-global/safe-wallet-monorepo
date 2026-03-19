import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import SelectSafesOnboarding from '@/features/spaces/components/SelectSafesOnboarding'

const SelectSafesPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Select Safes`}</title>
      </Head>

      <SelectSafesOnboarding />
    </>
  )
}

export default SelectSafesPage
