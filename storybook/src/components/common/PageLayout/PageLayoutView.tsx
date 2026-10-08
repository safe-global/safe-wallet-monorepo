import type { ReactElement, ReactNode, Ref } from 'react'
import classnames from 'classnames'
import css from './styles.module.css'

export type PageLayoutViewProps = {
  isStaticPage: boolean
  logo: ReactNode
  sideDrawer: ReactNode
  isSidebarRoute: boolean
  isSidebarVisible: boolean
  isSidebarExpanded: boolean
  isAnimated: boolean
  hideHeader: boolean
  topbarRef: Ref<HTMLDivElement>
  isTopbarElevated: boolean
  isTopbarAboveOverlay: boolean
  topbar: ReactNode
  isWelcomeListRoute: boolean
  isOnboardingRoute: boolean
  breadcrumbs: ReactNode
  /** Wraps the page content in the SafeLoadingError container */
  wrapContent: (content: ReactNode) => ReactNode
  batchSidebar: ReactNode
  footer: ReactNode
  children: ReactElement
}

export function PageLayoutView({
  isStaticPage,
  logo,
  sideDrawer,
  isSidebarRoute,
  isSidebarVisible,
  isSidebarExpanded,
  isAnimated,
  hideHeader,
  topbarRef,
  isTopbarElevated,
  isTopbarAboveOverlay,
  topbar,
  isWelcomeListRoute,
  isOnboardingRoute,
  breadcrumbs,
  wrapContent,
  batchSidebar,
  footer,
  children,
}: PageLayoutViewProps): ReactElement {
  return (
    <>
      {isStaticPage && <div className="px-6 py-4">{logo}</div>}

      {sideDrawer}

      <div
        className={classnames(css.main, {
          [css.mainNoSidebar]: !isSidebarVisible || !isSidebarRoute,
          [css.mainAnimated]: isSidebarRoute && isAnimated,
          [css.mainNoHeader]: hideHeader,
          [css.mainSpace]: !hideHeader,
          [css.mainSidebarCollapsed]: isSidebarRoute && isSidebarVisible && !isSidebarExpanded,
        })}
      >
        {!hideHeader && (
          <div
            ref={topbarRef}
            className={classnames(css.topbar, {
              [css.topbarElevated]: isTopbarElevated,
              [css.topbarAboveOverlay]: isTopbarAboveOverlay,
              // The topbar is absolutely positioned, so it can't inherit `.main`'s sidebar
              // offset — it has to reproduce it. Keep these conditions identical to the
              // `mainNoSidebar` / `mainSidebarCollapsed` ones below or the header drifts out
              // of alignment with the page content underneath it.
              [css.topbarNoSidebar]: !isSidebarVisible || !isSidebarRoute,
              [css.topbarCollapsed]: isSidebarRoute && isSidebarVisible && !isSidebarExpanded,
            })}
          >
            {topbar}
          </div>
        )}

        <div className={classnames(css.content, { [css.welcomeGlow]: isWelcomeListRoute })}>
          {wrapContent(
            <>
              {!hideHeader && breadcrumbs}

              {isOnboardingRoute ? <div className={css.onboardingMotion}>{children}</div> : children}
            </>,
          )}
        </div>

        {batchSidebar}

        {footer}
      </div>
    </>
  )
}
