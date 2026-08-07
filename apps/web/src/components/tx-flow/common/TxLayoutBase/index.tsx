import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ComponentType, type ReactElement, type ReactNode, useContext } from 'react'
import { ArrowLeft } from 'lucide-react'
import classnames from 'classnames'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useIsBelowMd, useMediaQuery } from '@/hooks/useMediaQuery'
import { ProgressBar } from '@/components/common/ProgressBar'
import { SafeTxContext } from '../../SafeTxProvider'
import TxNonce from '../TxNonce'
import TxStatusWidget from '../TxStatusWidget'
import SafeShieldWidget from '@/features/safe-shield'
import css from './styles.module.css'

export const TxLayoutHeader = ({
  hideNonce,
  fixedNonce,
  icon,
  subtitle,
}: {
  hideNonce?: boolean
  fixedNonce?: boolean
  icon?: ComponentType
  subtitle?: ReactNode
}) => {
  const { safe } = useSafeInfo()
  const { nonceNeeded } = useContext(SafeTxContext)

  if (hideNonce && !icon && !subtitle) return null

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
      {!hideNonce && safe.deployed && nonceNeeded && <TxNonce canEdit={!fixedNonce} />}
    </div>
  )
}

export type TxLayoutBaseProps = {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ComponentType
  txSummary?: Transaction
  hideNonce?: boolean
  fixedNonce?: boolean
  hideProgress?: boolean
  isReplacement?: boolean
  isMessage?: boolean
  isBatch?: boolean
  hideSafeShield?: boolean
  /** Zero-based index of the step being shown. */
  step: number
  /** Total number of steps, used to flag the last step to the status widget. */
  stepCount: number
  /** Completion percentage for the progress bar. */
  progress: number
  /** Back handler; the button only renders when set and not on the first step. */
  onBack?: () => void
  /** The current step's content. */
  children: ReactNode
  /** Optional extra content rendered under the Safe Shield widget (used by the slot-based flows). */
  sidebarSlot?: ReactNode
}

/**
 * The presentational chrome shared by every transaction flow: the status rail, the titled
 * card with progress bar + header, the step content, and the Safe Shield sidebar. It is
 * source-agnostic — {@link TxLayout} feeds it from props (and wraps the providers), while
 * TxFlowContent feeds it from TxFlowContext (and passes the sidebar slot). Keep the provider
 * wiring OUT of here so both entry points can own their own context setup.
 */
const TxLayoutBase = ({
  title,
  subtitle,
  icon,
  txSummary,
  hideNonce = false,
  fixedNonce = false,
  hideProgress = false,
  isReplacement = false,
  isMessage = false,
  isBatch = false,
  hideSafeShield = false,
  step,
  stepCount,
  progress,
  onBack,
  children,
  sidebarSlot,
}: TxLayoutBaseProps): ReactElement => {
  const isSmallScreen = useIsBelowMd()
  const isDesktop = useMediaQuery('(min-width:1200px)')

  return (
    <div className={classnames('flex flex-wrap', css.container)}>
      {!isReplacement && !isSmallScreen && (
        /* Icons-only below 1200px (see StatusLabel) — the rail gives its 200px back to the card
           rather than squeezing it, since the card is what the user is actually filling in. */
        <div className="w-14 pt-10 min-[1200px]:w-[200px]">
          <aside>
            <div className="fixed flex flex-col gap-6">
              <TxStatusWidget
                isLastStep={step === stepCount - 1}
                txSummary={txSummary}
                isBatch={isBatch}
                isMessage={isMessage}
              />
            </div>
          </aside>
        </div>
      )}

      {/* min-[900px]:flex-1 + min-w-0 keep this column at a stable share of the row (flex-basis 0)
          so it never wraps below the fixed-width status rail when a step's content is wide — otherwise
          the card jumps horizontally and resizes between steps. The 900px breakpoint matches the CSS
          module and useIsBelowMd so the layout switches in one place, not across two mismatched ones. */}
      <div className="w-full min-w-0 flex-grow min-[900px]:flex-1 min-[900px]:px-4 min-[1200px]:px-10">
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
                    <ProgressBar value={progress} />
                  </div>
                )}

                <TxLayoutHeader subtitle={subtitle} icon={icon} hideNonce={hideNonce} fixedNonce={fixedNonce} />
              </div>

              <div className={css.step}>
                {children}

                {onBack && step > 0 && (
                  <Button
                    data-testid="modal-back-btn"
                    variant={isDesktop ? 'outline' : 'ghost'}
                    size="submit"
                    onClick={onBack}
                    className={css.backButton}
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            {!isReplacement && !hideSafeShield && (
              <div className={classnames('w-full min-[900px]:w-[37.5%] min-[900px]:shrink-0 lg:w-[320px]', css.widget)}>
                <div className={css.sticky}>
                  <SafeShieldWidget />

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

export default TxLayoutBase
