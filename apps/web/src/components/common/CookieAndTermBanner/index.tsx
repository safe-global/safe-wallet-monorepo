import { useEffect, type ReactElement } from 'react'
import classnames from 'classnames'
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

import css from './styles.module.css'
import { COOKIE_AND_TERM_WARNING } from './constants'
import WarningMessage from './WarningMessage'
import IntroText from './IntroText'
import CookieOptionsList from './CookieOptionsList'
import CookieBannerActions from './CookieBannerActions'

export const CookieAndTermBanner = ({
  warningKey,
  inverted,
}: {
  warningKey?: CookieAndTermType
  inverted?: boolean
}): ReactElement => {
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
    <div data-testid="cookies-popup" className={classnames(css.container, { [css.inverted]: inverted })}>
      {warning && <WarningMessage message={warning} />}
      <form>
        <div className="flex items-center">
          <div className="flex-1">
            <IntroText lastUpdated={metadata.lastUpdated} />

            <div className="flex items-center gap-8">
              <CookieOptionsList control={control} />
            </div>

            <CookieBannerActions onAccept={handleAccept} onAcceptAll={handleAcceptAll} />
          </div>
        </div>
      </form>
    </div>
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
    <div className={css.popup}>
      <CookieAndTermBanner warningKey={cookiePopup.warningKey} inverted />
    </div>
  ) : null
}
export default CookieBannerPopup
