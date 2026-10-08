import type { ReactElement, ReactNode } from 'react'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'

export const ReviewTransactionParseErrorView = (): ReactElement => <div>Error parsing data</div>

export type ReviewTransactionContentViewProps = {
  children?: ReactNode
  confirmationView: ReactNode
  mainSlot: ReactNode
  txCheckError: ReactNode
  footerSlot: ReactNode
  networkWarning: ReactNode
  unknownContractError: ReactNode
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  onContinueClick: () => void
  isSubmitDisabled?: boolean
  isSubmitLoading?: boolean
  isRiskBlocked?: boolean
}

export const ReviewTransactionContentView = ({
  children,
  confirmationView,
  mainSlot,
  txCheckError,
  footerSlot,
  networkWarning,
  unknownContractError,
  renderCheckWallet,
  onContinueClick,
  isSubmitDisabled,
  isSubmitLoading,
  isRiskBlocked,
}: ReviewTransactionContentViewProps): ReactElement => {
  return (
    <>
      <TxCard>
        {children}

        {confirmationView}

        {mainSlot}

        <Separator bleed="6" className="mt-4" />

        {txCheckError}

        {footerSlot}
        {networkWarning}
        {unknownContractError}

        <TxCardActions className="!mt-0">
          {/* Continue button */}
          {renderCheckWallet((isOk) => {
            return (
              <Button
                data-testid="continue-sign-btn"
                type="submit"
                size="submit"
                onClick={onContinueClick}
                disabled={!isOk || isSubmitDisabled || isRiskBlocked}
                className="order-1"
              >
                {isSubmitLoading ? <Spinner className="size-5" /> : 'Continue'}
              </Button>
            )
          })}
        </TxCardActions>
      </TxCard>
    </>
  )
}
