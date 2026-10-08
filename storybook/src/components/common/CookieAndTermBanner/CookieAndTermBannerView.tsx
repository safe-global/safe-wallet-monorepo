import type { ReactElement, ReactNode } from 'react'
import classnames from 'classnames'
import css from './styles.module.css'
import WarningMessage from '@views/components/common/CookieAndTermBanner/WarningMessage'
import IntroText from '@views/components/common/CookieAndTermBanner/IntroText'
import CookieBannerActions from '@views/components/common/CookieAndTermBanner/CookieBannerActions'

/** Overlay chrome for the first-visit popup, matching the other overlays in the design system. */
export const POPUP_SURFACE = 'bg-popover text-popover-foreground rounded-lg shadow-lg ring-foreground/10 ring-1'

export type CookieAndTermBannerViewProps = {
  warning?: string
  lastUpdated: string
  options: ReactNode
  onAccept: () => void
  onAcceptAll: () => void
}

export function CookieAndTermBannerView({
  warning,
  lastUpdated,
  options,
  onAccept,
  onAcceptAll,
}: CookieAndTermBannerViewProps): ReactElement {
  return (
    <div data-testid="cookies-popup" className={css.container}>
      {warning && <WarningMessage message={warning} />}
      <form>
        <IntroText lastUpdated={lastUpdated} />

        {options}

        <CookieBannerActions onAccept={onAccept} onAcceptAll={onAcceptAll} />
      </form>
    </div>
  )
}

export function CookieBannerPopupView({ children }: { children: ReactNode }): ReactElement {
  return <div className={classnames(css.popup, POPUP_SURFACE)}>{children}</div>
}
