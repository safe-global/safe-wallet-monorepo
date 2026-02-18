import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import AddAddressBookOnboarding from '@/components/onboarding/AddAddressBookOnboarding'

const AddressBookPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Address book`}</title>
      </Head>

      <AddAddressBookOnboarding />
    </>
  )
}

export default AddressBookPage
