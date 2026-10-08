import type { ReactElement, ReactNode, Ref } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import classNames from 'classnames'
import css from './styles.module.css'
import { Card } from '@/components/ui/card'
import { UnsignedWarningView } from '@/components/transactions/Warning/WarningView'

export type TxDetailsBlockViewProps = {
  isUnsigned: boolean
  txNote: ReactNode
  simulation?: ReactNode
  renderTxData: (children: ReactNode) => ReactNode
  decodedDataRef: Ref<HTMLDivElement>
  decodedData: ReactNode
  moduleAddressInfo?: ReactNode
  showUnsignedWarning: boolean
  summary: ReactNode
  multisend?: ReactNode
  showSigners: boolean
  txSigners: ReactNode
  securitySection?: ReactNode
  buttons?: ReactNode
}

export const TxDetailsBlockView = ({
  isUnsigned,
  txNote,
  simulation,
  renderTxData,
  decodedDataRef,
  decodedData,
  moduleAddressInfo,
  showUnsignedWarning,
  summary,
  multisend,
  showSigners,
  txSigners,
  securitySection,
  buttons,
}: TxDetailsBlockViewProps): ReactElement => {
  return (
    <>
      {/* /Details */}
      <div className={`${css.details} ${isUnsigned ? css.noSigners : ''}`}>
        <div className={css.txNote}>{txNote}</div>

        <div className={css.detailsWrapper}>
          {simulation && <div className={css.inlineSimulation}>{simulation}</div>}

          <div className={css.txData}>{renderTxData(<div ref={decodedDataRef}>{decodedData}</div>)}</div>
        </div>

        {/* Module information*/}
        {moduleAddressInfo && (
          <div className={css.txModule}>
            <InfoDetails title="Executed via module:">{moduleAddressInfo}</InfoDetails>
          </div>
        )}

        <div className={css.txSummary}>
          {showUnsignedWarning && <UnsignedWarningView />}
          {summary}
        </div>

        {multisend && <div className={css.multiSend}>{multisend}</div>}
      </div>
      {/* Signers */}
      {showSigners && (
        <div className={css.txSigners}>
          {txSigners}

          {securitySection}

          {buttons && <div className={css.buttons}>{buttons}</div>}
        </div>
      )}
    </>
  )
}

export type TxDetailsViewProps = {
  contrastSurface: boolean
  block?: ReactNode
  loading: boolean
  hasError: boolean
  renderErrorMessage: (children: ReactNode) => ReactNode
}

export const TxDetailsView = ({
  contrastSurface,
  block,
  loading,
  hasError,
  renderErrorMessage,
}: TxDetailsViewProps): ReactElement => {
  return (
    <Card
      size={contrastSurface ? 'none' : 'default'}
      radius={contrastSurface ? 'none' : 'lg'}
      // eslint-disable-next-line no-restricted-syntax -- contrast variant clears the surface (bg-transparent) so css.containerContrast can paint it; nested-surface token
      className={classNames(css.container, contrastSurface && 'bg-transparent', {
        [css.containerContrast]: contrastSurface,
      })}
    >
      {block ? (
        block
      ) : loading ? (
        <div className={css.loading}>
          <Spinner className="size-10" />
        </div>
      ) : (
        hasError && (
          <div className={css.error}>{renderErrorMessage(<>Couldn&apos;t load the transaction details</>)}</div>
        )
      )}
    </Card>
  )
}
