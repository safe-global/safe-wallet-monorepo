import { TxFlowContext } from '../../TxFlowProvider'
import { type ReactNode, useContext } from 'react'
import { ArrowLeft } from 'lucide-react'
import classnames from 'classnames'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useIsBelowMd, useMediaQuery } from '@/hooks/useMediaQuery'
import { ProgressBar } from '@/components/common/ProgressBar'
import css from './styles.module.css'
import TxStatusWidget from '@/components/tx-flow/common/TxStatusWidget'
import SafeShieldWidget from '@/features/safe-shield'
import { TxLayoutHeader } from '../TxLayout'
import { Slot, SlotName } from '../../slots'

/**
 * TxFlowContent is a component that renders the main content of the transaction flow.
 * It uses the TxFlowContext to manage the transaction state and layout properties.
 * The component also handles the transaction steps and progress.
 * It accepts children components to be rendered within the flow.
 */
export const TxFlowContent = ({ children }: { children?: ReactNode[] | ReactNode }) => {
  const {
    txLayoutProps: {
      title = '',
      subtitle,
      txSummary,
      icon,
      fixedNonce,
      hideNonce,
      hideProgress,
      isReplacement,
      isMessage,
    },
    isBatch,
    step,
    progress,
    onPrev,
  } = useContext(TxFlowContext)
  const childrenArray = Array.isArray(children) ? children : [children]

  const isSmallScreen = useIsBelowMd()
  const isDesktop = useMediaQuery('(min-width:1200px)')

  return (
    <div className={classnames('flex flex-wrap', css.container)}>
      {!isReplacement && !isSmallScreen && (
        <div className="w-[200px] pt-10">
          <aside>
            <div className="fixed flex flex-col gap-6">
              <TxStatusWidget
                isLastStep={step === childrenArray.length - 1}
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
      <div className="w-full min-w-0 flex-grow min-[900px]:flex-1 min-[900px]:px-10">
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
                className={classnames(
                  'overflow-hidden rounded-t-xl border border-b-0 border-border bg-card',
                  css.header,
                  {
                    'rounded-t-2xl': hideProgress,
                  },
                )}
              >
                {!hideProgress && (
                  <div className={css.progressBar}>
                    <ProgressBar value={progress} />
                  </div>
                )}

                <TxLayoutHeader subtitle={subtitle} icon={icon} hideNonce={hideNonce} fixedNonce={fixedNonce} />
              </div>

              <div className={css.step}>
                {childrenArray[step]}

                {onPrev && step > 0 && (
                  <Button
                    data-testid="modal-back-btn"
                    variant={isDesktop ? 'outline' : 'ghost'}
                    size="submit"
                    onClick={onPrev}
                    className={css.backButton}
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            {!isReplacement && (
              <div className={classnames('w-full min-[900px]:w-[37.5%] min-[900px]:shrink-0 lg:w-[320px]', css.widget)}>
                <div className={css.sticky}>
                  <SafeShieldWidget />

                  <div className={css.sidebarSlot}>
                    <Slot name={SlotName.Sidebar} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
