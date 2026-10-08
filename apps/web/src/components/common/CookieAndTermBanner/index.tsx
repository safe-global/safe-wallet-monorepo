import { useEffect, type ReactElement } from 'react'
import { useForm } from 'react-hook-form'
import * as metadata from '@/markdown/terms/version'

import { useAppDispatch, useAppSelector } from '@/store'
import {
  selectCookies,
  CookieAndTermType,
  saveCookieAndTermConsent,
  hasAcceptedTerms,
} from '@/store/cookiesAndTermsSlice'
import { selectCookieBanner, openCookieBanner, closeCookieBanner } from '@/store/popupSlice'

import { COOKIE_AND_TERM_WARNING } from './constants'
import CookieOptionsList from './CookieOptionsList'
import {
  CookieAndTermBannerView,
  CookieBannerPopupView,
} from '@views/components/common/CookieAndTermBanner/CookieAndTermBannerView'

export { POPUP_SURFACE } from '@views/components/common/CookieAndTermBanner/CookieAndTermBannerView'

export const CookieAndTermBanner = ({ warningKey }: { warningKey?: CookieAndTermType }): ReactElement => {
  const warning = warningKey ? COOKIE_AND_TERM_WARNING[warningKey] : undefined
  const dispatch = useAppDispatch()
  const cookies = useAppSelector(selectCookies)

  const { control, getValues, setValue } = useForm({
    defaultValues: {
      [CookieAndTermType.TERMS]: true,
      [CookieAndTermType.NECESSARY]: true,
      [CookieAndTermType.UPDATES]: cookies[CookieAndTermType.UPDATES] ?? false,
      [CookieAndTermType.ANALYTICS]: cookies[CookieAndTermType.ANALYTICS] ?? false,
      ...(warningKey ? { [warningKey]: true } : {}),
    },
  })

  const handleAccept = () => {
    const values = getValues()
    dispatch(
      saveCookieAndTermConsent({
        ...values,
        termsVersion: metadata.version,
      }),
    )
    dispatch(closeCookieBanner())
  }

  const handleAcceptAll = () => {
    setValue(CookieAndTermType.UPDATES, true)
    setValue(CookieAndTermType.ANALYTICS, true)
    setTimeout(handleAccept, 300)
  }

  return (
    <CookieAndTermBannerView
      warning={warning}
      lastUpdated={metadata.lastUpdated}
      options={<CookieOptionsList control={control} />}
      onAccept={handleAccept}
      onAcceptAll={handleAcceptAll}
    />
  )
}

const CookieBannerPopup = (): ReactElement | null => {
  const cookiePopup = useAppSelector(selectCookieBanner)
  const dispatch = useAppDispatch()
  const hasAccepted = useAppSelector(hasAcceptedTerms)
  const shouldOpen = !hasAccepted

  useEffect(() => {
    if (shouldOpen) {
      dispatch(openCookieBanner({}))
    } else {
      dispatch(closeCookieBanner())
    }
  }, [dispatch, shouldOpen])

  return cookiePopup.open ? (
    <CookieBannerPopupView>
      <CookieAndTermBanner warningKey={cookiePopup.warningKey} />
    </CookieBannerPopupView>
  ) : null
}
export default CookieBannerPopup
