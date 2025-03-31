import React, { type ReactNode, useContext, useEffect } from 'react'
import { TxFlowContext, type TxFlowContextType } from './TxFlowProvider'

export type TxFlowStepProps = TxFlowContextType['txLayoutProps'] & { children?: ReactNode }

export const TxFlowStep = ({ children, ...txLayoutProps }: TxFlowStepProps) => {
  const { updateTxLayoutProps } = useContext(TxFlowContext)

  useEffect(() => {
    updateTxLayoutProps(txLayoutProps)
  }, [])

  return <>{children}</>
}
