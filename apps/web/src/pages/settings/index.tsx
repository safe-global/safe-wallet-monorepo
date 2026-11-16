import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { generalSettingsNavItems, settingsNavItems } from '@/components/common/NavTabs/navItemsConfig'
import { BRAND_NAME } from '@/config/constants'

const Settings = () => {
  const router = useRouter()

  useEffect(() => {
    const redirectPath = router.query.safe ? settingsNavItems[0].href : generalSettingsNavItems[0].href
    router.push(redirectPath, {
      query: router.query,
    })
  }, [router, router.query.safe])

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings`}</title>
      </Head>
    </>
  )
}

export default Settings
