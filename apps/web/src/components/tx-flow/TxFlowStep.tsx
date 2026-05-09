import React, { type ReactNode, useContext, useEffect } from 'react'
import { TxFlowContext, type TxFlowContextType } from '../tx-flow/TxFlowProvider'

export type TxFlowStepProps = TxFlowContextType['txLayoutProps'] & { children?: ReactNode }

/**
 * TxFlowStep is a component that allows you to set the layout properties for a transaction flow step.
 * It uses the TxFlowContext to update the layout properties when the component is mounted.
 */
export const TxFlowStep = ({ children, ...txLayoutProps }: TxFlowStepProps) => {
  const { updateTxLayoutProps } = useContext(TxFlowContext)

  useEffect(() => {
    updateTxLayoutProps(txLayoutProps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txLayoutProps.subtitle, txLayoutProps.title])

  return <>{children}</>
}
