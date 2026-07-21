import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useSafeInfo from '@/hooks/useSafeInfo'
import { type ComponentType, type ReactElement, type ReactNode, useContext } from 'react'
import { ArrowLeft } from 'lucide-react'
import classnames from 'classnames'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useIsBelowMd, useMediaQuery } from '@/hooks/useMediaQuery'
import { ProgressBar } from '@/components/common/ProgressBar'
import SafeTxProvider, { SafeTxContext } from '../../SafeTxProvider'
import { TxInfoProvider } from '@/components/tx-flow/TxInfoProvider'
import TxNonce from '../TxNonce'
import TxStatusWidget from '../TxStatusWidget'
import css from './styles.module.css'
import SafeShieldWidget from '@/features/safe-shield'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'

export const TxLayoutHeader = ({
  hideNonce,
  fixedNonce,
  icon,
  subtitle,
}: {
  hideNonce: TxLayoutProps['hideNonce']
  fixedNonce: TxLayoutProps['fixedNonce']
  icon: TxLayoutProps['icon']
  subtitle: TxLayoutProps['subtitle']
}) => {
  const { safe } = useSafeInfo()
  const { nonceNeeded } = useContext(SafeTxContext)

  if (hideNonce && !icon && !subtitle) return null

  const Icon = icon

  return (
    <div className={css.headerInner}>
      <div className="flex items-center">
        {Icon && (
          <div className={css.icon}>
            <Icon />
          </div>
        )}

        <Typography variant="h4" className="font-bold">
          {subtitle}
        </Typography>
      </div>
      {!hideNonce && safe.deployed && nonceNeeded && <TxNonce canEdit={!fixedNonce} />}
    </div>
  )
}

type TxLayoutProps = {
  title: ReactNode
  children: ReactNode
  subtitle?: ReactNode
  icon?: ComponentType
  step?: number
  txSummary?: Transaction
  onBack?: () => void
  hideNonce?: boolean
  fixedNonce?: boolean
  hideProgress?: boolean
  isBatch?: boolean
  isReplacement?: boolean
  isMessage?: boolean
  hideSafeShield?: boolean
}

const TxLayout = ({
  title,
  subtitle,
  icon,
  children,
  step = 0,
  txSummary,
  onBack,
  hideNonce = false,
  fixedNonce = false,
  hideProgress = false,
  isBatch = false,
  isReplacement = false,
  isMessage = false,
  hideSafeShield = false,
}: TxLayoutProps): ReactElement => {
  const isSmallScreen = useIsBelowMd()
  const isDesktop = useMediaQuery('(min-width:1200px)')

  const steps = Array.isArray(children) ? children : [children]
  const progress = Math.round(((step + 1) / steps.length) * 100)

  return (
    <SafeTxProvider>
      <TxInfoProvider>
        <SafeShieldProvider>
          <div className={classnames('flex flex-wrap', css.container)}>
            {!isReplacement && !isSmallScreen && (
              <div className="w-[200px] pt-10">
                <aside>
                  <div className="fixed flex flex-col gap-6">
                    <TxStatusWidget
                      isLastStep={step === steps.length - 1}
                      txSummary={txSummary}
                      isBatch={isBatch}
                      isMessage={isMessage}
                    />
                  </div>
                </aside>
              </div>
            )}

            {/* md:flex-1 + min-w-0 keep this column at a stable share of the row (flex-basis 0) so it
                never wraps below the fixed-width status rail when a step's content is wide — otherwise
                the card jumps horizontally and resizes between steps. */}
            <div className="w-full min-w-0 flex-grow md:flex-1 md:px-10">
              <div className={classnames('mx-auto w-full max-w-[1200px]', css.contentContainer)}>
                {/* md:flex-nowrap keeps the SafeShield sidebar beside the card (its intended md:37.5% / lg:320px
                    slot) instead of wrapping below it when a step's content is tall enough to add a scrollbar —
                    the card (min-w-0) absorbs the shrink, so it stays put across steps rather than re-centering. */}
                <div className="flex flex-wrap justify-center gap-6 md:flex-nowrap">
                  {/* Main content */}
                  <div className="min-w-0 flex-grow md:max-w-[672px]">
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
                      {steps[step]}

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
                    <div className={classnames('w-full md:w-[37.5%] md:shrink-0 lg:w-[320px]', css.widget)}>
                      <div className={css.sticky}>
                        <SafeShieldWidget />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SafeShieldProvider>
      </TxInfoProvider>
    </SafeTxProvider>
  )
}

export default TxLayout
