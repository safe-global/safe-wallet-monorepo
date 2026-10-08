import type { NextPage } from 'next'
import Head from 'next/head'
import AddressBookTable from '@/components/address-book/AddressBookTable'
import { BRAND_NAME } from '@/config/constants'
import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'

const ADDRESS_BOOK_SOURCE = 'localOnly'

const AddressBook: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Address book`}</title>
      </Head>

      <AddressBookSourceProvider source={ADDRESS_BOOK_SOURCE}>
        <AddressBookTable />
      </AddressBookSourceProvider>
    </>
  )
}

export default AddressBook
