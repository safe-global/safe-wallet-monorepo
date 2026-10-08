import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import LoadSafe, { loadSafeDefaultData } from '@/components/new-safe/load'
import { BRAND_NAME } from '@/config/constants'
import { NewSafePageView } from '@views/pages/new-safe/NewSafePageView'

const Load: NextPage = () => {
  const router = useRouter()
  const { address = '' } = router.query
  const safeAddress = Array.isArray(address) ? address[0] : address

  return (
    <NewSafePageView>
      <Head>
        <title>{`${BRAND_NAME} – Add Safe account`}</title>
      </Head>

      {safeAddress ? (
        <LoadSafe initialData={{ ...loadSafeDefaultData, address: safeAddress }} />
      ) : (
        <LoadSafe initialData={loadSafeDefaultData} />
      )}
    </NewSafePageView>
  )
}

export default Load
