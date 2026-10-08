import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import SubmitButton from '@/components/common/SubmitButton'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import classNames from 'classnames'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxCardActions } from '@/components/tx-flow/common/TxCard'

export type CounterfactualFormViewProps = {
  baseFee: string
  activationFee: string
  nativeCurrencySymbol?: string
  advancedParams: ReactNode
  cannotPropose: boolean
  isExecutionLoop: boolean
  walletCanPay: boolean
  nonOwnerError: ReactNode
  txCheckError: ReactNode
  submitError?: ReactNode
  renderErrorMessage: (children: ReactNode) => ReactNode
  checkWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  isSubmittable: boolean
  submitDisabled: boolean
  onSubmit: (e: SyntheticEvent) => void
}

export const CounterfactualFormView = ({
  baseFee,
  activationFee,
  nativeCurrencySymbol,
  advancedParams,
  cannotPropose,
  isExecutionLoop,
  walletCanPay,
  nonOwnerError,
  txCheckError,
  submitError,
  renderErrorMessage,
  checkWallet,
  isSubmittable,
  submitDisabled,
  onSubmit,
}: CounterfactualFormViewProps): ReactElement => {
  return (
    <>
      <form onSubmit={onSubmit}>
        <Alert variant="info" className="mb-4 border-0">
          <AlertSeverityIcon variant="info" />
          <AlertDescription>
            Executing this transaction will activate your account.
            <br />
            <ul style={{ margin: 0, padding: '4px 16px 0' }}>
              <li>
                Base fee: &asymp;{' '}
                <strong>
                  {baseFee} {nativeCurrencySymbol}
                </strong>
              </li>
              <li>
                One-time activation fee: &asymp;{' '}
                <strong>
                  {activationFee} {nativeCurrencySymbol}
                </strong>
              </li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className={classNames(commonCss.params)}>{advancedParams}</div>

        {/* Error messages */}
        {cannotPropose
          ? nonOwnerError
          : isExecutionLoop
            ? renderErrorMessage(
                <>Cannot execute a transaction from the Safe account itself, please connect a different account.</>,
              )
            : !walletCanPay
              ? renderErrorMessage(
                  <>Your connected wallet doesn&apos;t have enough funds to execute this transaction.</>,
                )
              : txCheckError}

        {submitError && <div className="mt-2">{submitError}</div>}

        <Separator bleed="6" />

        <TxCardActions>
          {/* Submit button */}
          {checkWallet((isOk) => (
            <SubmitButton loading={!isSubmittable} disabled={!isOk || submitDisabled}>
              Execute
            </SubmitButton>
          ))}
        </TxCardActions>
      </form>
    </>
  )
}
