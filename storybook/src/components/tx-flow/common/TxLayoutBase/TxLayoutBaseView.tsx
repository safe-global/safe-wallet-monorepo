import { type ComponentType, type ReactElement, type ReactNode } from 'react'
import classnames from 'classnames'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { ProgressBar } from '@/components/common/ProgressBar'
import css from './styles.module.css'

export type TxLayoutHeaderViewProps = {
  icon?: ComponentType
  subtitle?: ReactNode
  nonce?: ReactNode
}

export const TxLayoutHeaderView = ({ icon, subtitle, nonce }: TxLayoutHeaderViewProps): ReactElement => {
  const Icon = icon

  return (
    <div className={css.headerInner}>
      <div className="flex min-w-0 flex-1 items-center">
        {Icon && (
          <div className={css.icon}>
            <Icon />
          </div>
        )}

        <Typography variant="h4" className="font-bold [overflow-wrap:anywhere]">
          {subtitle}
        </Typography>
      </div>
      {nonce}
    </div>
  )
}

export type TxLayoutBaseViewProps = {
  title: ReactNode
  hideProgress: boolean
  isReplacement: boolean
  hideSafeShield: boolean
  hideStatusRail: boolean
  isSmallScreen: boolean
  isDarkMode: boolean
  step: number
  progress: number
  onBack?: () => void
  children: ReactNode
  sidebarSlot?: ReactNode
  statusWidget: ReactNode
  header: ReactNode
  safeShield: ReactNode
}

export const TxLayoutBaseView = ({
  title,
  hideProgress,
  isReplacement,
  hideSafeShield,
  hideStatusRail,
  isSmallScreen,
  isDarkMode,
  step,
  progress,
  onBack,
  children,
  sidebarSlot,
  statusWidget,
  header,
  safeShield,
}: TxLayoutBaseViewProps): ReactElement => {
  return (
    <div className={classnames('flex flex-wrap', css.container)}>
      {!isReplacement && !hideStatusRail && !isSmallScreen && (
        /* Icons-only below 1200px (see StatusLabel) — the rail gives its 200px back to the card
           rather than squeezing it, since the card is what the user is actually filling in. */
        <div className="w-14 pt-10 min-[1200px]:w-[200px]">
          <aside>
            <div className="fixed flex flex-col gap-6">{statusWidget}</div>
          </aside>
        </div>
      )}

      {/* min-[900px]:flex-1 + min-w-0 keep this column at a stable share of the row (flex-basis 0)
          so it never wraps below the fixed-width status rail when a step's content is wide — otherwise
          the card jumps horizontally and resizes between steps. The 900px breakpoint matches the CSS
          module and useIsBelowMd so the layout switches in one place, not across two mismatched ones.
          Left padding only: the right gutter is TxModalDialog's close-button column (see its styles). */}
      <div className="w-full min-w-0 flex-grow min-[900px]:flex-1 min-[900px]:pl-4 min-[1200px]:pl-10">
        <div className={classnames('mx-auto w-full max-w-[1200px]', css.contentContainer)}>
          {/* min-[900px]:flex-nowrap keeps the SafeShield sidebar beside the card (its 37.5% / lg:320px
              slot) instead of wrapping below it when a step's content is tall enough to add a scrollbar —
              the card (min-w-0) absorbs the shrink, so it stays put across steps. Below 900px the row
              wraps and the widget stacks full-width beneath the card. */}
          <div className="flex flex-wrap justify-center gap-6 min-[900px]:flex-nowrap">
            {/* Main content */}
            <div className="min-w-0 flex-grow min-[900px]:max-w-[672px]">
              <div className={css.titleWrapper}>
                <Typography data-testid="modal-title" variant="h3" className={classnames('font-bold', css.title)}>
                  {title}
                </Typography>
              </div>

              <div
                data-testid="modal-header"
                /* 24px is the app-wide card radius (every dashboard card computes to it). TxCard
                   below must use `radius="xl"` to match, or the bottom reads flatter than the top. */
                className={classnames('overflow-hidden rounded-t-xl bg-card', css.header)}
              >
                {!hideProgress && (
                  <div className={css.progressBar}>
                    <ProgressBar value={progress} color={isDarkMode ? 'primary' : 'secondary'} />
                  </div>
                )}

                {header}
              </div>

              <div className={css.step}>
                {children}

                {/* No icon, and not `size="submit"`: its 7rem floor plus the arrow cost width the
                    narrowest card cannot spare beside a long action label. */}
                {onBack && step > 0 && (
                  <Button data-testid="modal-back-btn" variant="outline" onClick={onBack} className={css.backButton}>
                    Back
                  </Button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            {!isReplacement && !hideSafeShield && (
              <div className={classnames('w-full min-[900px]:w-[37.5%] min-[900px]:shrink-0 lg:w-[320px]', css.widget)}>
                <div className={css.sticky}>
                  {safeShield}

                  {sidebarSlot ? <div className={css.sidebarSlot}>{sidebarSlot}</div> : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
