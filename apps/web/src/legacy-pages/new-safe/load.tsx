import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import LoadSafe, { loadSafeDefaultData } from '@/components/new-safe/load'
import { BRAND_NAME } from '@/config/constants'

const Load: NextPage = () => {
  const router = useRouter()
  const { address = '' } = router.query
  const safeAddress = Array.isArray(address) ? address[0] : address

  return (
    <main>
      <Head>
        <title>{`${BRAND_NAME} – Add Safe Account`}</title>
      </Head>

      {safeAddress ? (
        <LoadSafe initialData={{ ...loadSafeDefaultData, address: safeAddress }} />
      ) : (
        <LoadSafe initialData={loadSafeDefaultData} />
      )}
    </main>
  )
}

export default Load
