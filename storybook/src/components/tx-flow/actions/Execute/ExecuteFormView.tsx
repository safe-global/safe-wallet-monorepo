import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import ModalDialog from '@/components/common/ModalDialog'
import classNames from 'classnames'
import ErrorMessage from '@/components/tx/ErrorMessage'
import TxCheckError from '@/components/tx/TxCheckError'
import NonOwnerError from '@/components/tx/shared/errors/NonOwnerError'
import SplitMenuButton from '@/components/common/SplitMenuButton'
import { TxCardActions } from '@/components/tx-flow/common/TxCard'
import css from './styles.module.css'
import commonCss from '@/components/tx-flow/common/styles.module.css'

export type ExecuteFormViewProps = {
  onSubmit: (e: SyntheticEvent) => void
  showExecutionSelector: boolean
  advancedParams: ReactNode
  executionMethodSelector: ReactNode
  cannotPropose: boolean
  isExecutionLoop: boolean
  walletCanPay: boolean
  willRelay: boolean
  checkError?: Error
  refusalMessage?: string
  relaySimErrorCode?: string
  onCloseRelayDialog: () => void
  onExecuteAnyway: () => void
  isSubmitLoading: boolean
  chainId?: string
  secondaryAction?: ReactNode
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  slotId?: string
  onChange?: (id: string) => void
  options: { label: string; id: string }[]
  submitDisabled: boolean
  tooltip?: string
}

export const ExecuteFormView = ({
  onSubmit,
  showExecutionSelector,
  advancedParams,
  executionMethodSelector,
  cannotPropose,
  isExecutionLoop,
  walletCanPay,
  willRelay,
  checkError,
  refusalMessage,
  relaySimErrorCode,
  onCloseRelayDialog,
  onExecuteAnyway,
  isSubmitLoading,
  chainId,
  secondaryAction,
  renderCheckWallet,
  slotId,
  onChange,
  options,
  submitDisabled,
  tooltip,
}: ExecuteFormViewProps): ReactElement => {
  return (
    <>
      <form onSubmit={onSubmit}>
        <div className={classNames(commonCss.params, { [css.noBottomBorderRadius]: showExecutionSelector })}>
          {advancedParams}

          {showExecutionSelector && <div className={css.noTopBorder}>{executionMethodSelector}</div>}
        </div>

        {/* Error messages */}
        {cannotPropose ? (
          <NonOwnerError />
        ) : isExecutionLoop ? (
          <ErrorMessage>
            Cannot execute a transaction from the Safe account itself, please connect a different account.
          </ErrorMessage>
        ) : !walletCanPay && !willRelay ? (
          <ErrorMessage level="info">
            Your connected wallet doesn&apos;t have enough funds to execute this transaction.
          </ErrorMessage>
        ) : checkError ? (
          <TxCheckError error={checkError} context="estimation" />
        ) : null}

        {refusalMessage && <ErrorMessage level="warning">{refusalMessage}</ErrorMessage>}

        {/* CGW pre-relay simulation verdict */}
        {relaySimErrorCode === 'SIMULATION_FAILED' && (
          <ErrorMessage>
            This transaction is expected to fail on-chain, so it can&apos;t be relayed. Review the transaction or reject
            it.
          </ErrorMessage>
        )}

        <ModalDialog
          open={relaySimErrorCode === 'INDETERMINATE_SIMULATION'}
          onClose={onCloseRelayDialog}
          dialogTitle="Confirm execution"
          chainId={chainId}
          data-testid="relay-indeterminate-dialog"
        >
          <div className="px-6 pt-2 pb-4">
            We couldn&apos;t review this transaction. If you execute and it fails, you&apos;ll still pay the network
            fee. You can run the simulation yourself from the Safe Shield panel before deciding.
          </div>

          <div className="flex justify-between gap-2 p-6 pt-2">
            <Button data-testid="relay-go-back-btn" variant="ghost" onClick={onCloseRelayDialog}>
              Back
            </Button>
            <Button data-testid="relay-accept-unverified-btn" disabled={isSubmitLoading} onClick={onExecuteAnyway}>
              Execute anyway
            </Button>
          </div>
        </ModalDialog>

        <div className="py-6">
          <Separator bleed="6" />
        </div>

        <TxCardActions className={secondaryAction ? '[&>div]:w-full [&>div]:justify-between' : undefined}>
          {secondaryAction}

          {/* Shrink-wraps the split button so a full-width row keeps it at content width */}
          <div>
            {renderCheckWallet((isOk) =>
              tooltip ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <div>
                        <SplitMenuButton
                          selected={slotId}
                          onChange={({ id }) => onChange?.(id)}
                          options={options}
                          disabled={!isOk || submitDisabled}
                          loading={isSubmitLoading}
                          tooltip={tooltip}
                        />
                      </div>
                    }
                  />
                  <TooltipContent side="top">{tooltip}</TooltipContent>
                </Tooltip>
              ) : (
                <SplitMenuButton
                  selected={slotId}
                  onChange={({ id }) => onChange?.(id)}
                  options={options}
                  disabled={!isOk || submitDisabled}
                  loading={isSubmitLoading}
                  tooltip={tooltip}
                />
              ),
            )}
          </div>
        </TxCardActions>
      </form>
    </>
  )
}
