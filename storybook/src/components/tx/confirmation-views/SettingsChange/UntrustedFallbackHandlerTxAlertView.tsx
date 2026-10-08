import type { ReactElement, ReactNode } from 'react'

export type UntrustedFallbackHandlerTxAlertViewProps = {
  isTxExecuted: boolean
  renderWarning: (props: { message: ReactElement | string; txBuilderLinkPrefix?: string }) => ReactNode
}

export const UntrustedFallbackHandlerTxAlertView = ({
  isTxExecuted,
  renderWarning,
}: UntrustedFallbackHandlerTxAlertViewProps) => (
  <>
    {renderWarning({
      message: (
        <>
          This transaction {isTxExecuted ? 'has set' : 'sets'} an <b>unofficial</b> fallback handler.
        </>
      ),
      txBuilderLinkPrefix: isTxExecuted ? 'It can be altered via the' : '',
    })}
    {!isTxExecuted && (
      <>
        <br />
        <b>Proceed with caution:</b> ensure the fallback handler address is trusted and secure. If unsure, do not
        proceed.
      </>
    )}
  </>
)
