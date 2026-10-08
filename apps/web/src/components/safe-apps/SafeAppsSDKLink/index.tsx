import { useEffect, useState } from 'react'
import { SAFE_APPS_SDK_DOCS_URL } from '@/config/constants'
import { SafeAppsSDKLinkView } from '@views/components/safe-apps/SafeAppsSDKLink/SafeAppsSDKLinkView'

const SafeAppsSDKLink = () => {
  const [isMini, setMini] = useState(false)

  // Minimize the widget when the user scrolls down
  useEffect(() => {
    const MAX_SCROLL = 130

    const onScroll = () => {
      const isScrolled = document.documentElement.scrollTop > MAX_SCROLL
      setMini(isScrolled)
    }

    document.addEventListener('scroll', onScroll)

    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return <SafeAppsSDKLinkView isMini={isMini} docsUrl={SAFE_APPS_SDK_DOCS_URL} />
}

export default SafeAppsSDKLink
