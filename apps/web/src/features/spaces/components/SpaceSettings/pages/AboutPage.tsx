import { useState, useCallback } from 'react'
import { useAppDispatch } from '@/store'
import { openCookieBanner } from '@/store/popupSlice'
import { CookieAndTermType } from '@/store/cookiesAndTermsSlice'
import { APP_HOMEPAGE, APP_VERSION } from '@/config/version'
import { BRAND_NAME, SAFE_PRO_TERMS_URL, SAFE_PRO_USER_TERMS_URL } from '@/config/constants'
import { useLoadFeature } from '@/features/__core__'
import { SupportChatFeature, useSupportChat } from '@/features/support-chat'
import { useIsSafeProAnnouncementEnabled } from '@/features/safe-pro-announcement'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { AboutPageView } from '@views/features/spaces/components/SpaceSettings/pages/AboutPageView'

const AboutPage = () => {
  const dispatch = useAppDispatch()
  const [isSupportOpen, setSupportOpen] = useState(false)
  const { SupportChatDrawer, $isDisabled } = useLoadFeature(SupportChatFeature)
  const { config, user } = useSupportChat()
  const isOfficialHost = useIsOfficialHost()
  const showSupport = !$isDisabled && isOfficialHost
  const isAnnounced = useIsSafeProAnnouncementEnabled()
  const isSafePro = useIsSafeProEnabled()
  const showSafeProLinks = isAnnounced || isSafePro

  const handleContactSupportClick = useCallback(() => {
    setSupportOpen(true)
  }, [])

  const handleSupportClose = useCallback(() => {
    setSupportOpen(false)
  }, [])

  const handleCookiePrefs = () => {
    dispatch(openCookieBanner({ warningKey: CookieAndTermType.NECESSARY }))
  }

  return (
    <AboutPageView
      appVersion={APP_VERSION}
      appHomepage={APP_HOMEPAGE}
      brandName={BRAND_NAME}
      safeProUserTermsUrl={SAFE_PRO_USER_TERMS_URL}
      safeProTermsUrl={SAFE_PRO_TERMS_URL}
      showSupport={showSupport}
      showSafeProLinks={showSafeProLinks}
      onContactSupport={handleContactSupportClick}
      onCookiePrefs={handleCookiePrefs}
      supportDrawer={
        <SupportChatDrawer open={isSupportOpen} onClose={handleSupportClose} config={config} user={user} />
      }
    />
  )
}

export default AboutPage
