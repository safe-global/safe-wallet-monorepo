import React, { type ReactNode, useContext } from 'react'
import TxLayout from './common/TxLayout'
import { TxFlowContext } from './TxFlowProvider'

export const TxFlowContent = ({ children }: { children?: ReactNode[] | ReactNode }) => {
  const {
    txLayoutProps: { title = '', ...txLayoutProps },
    step,
    progress,
    onPrev,
  } = useContext(TxFlowContext)

  const childrenArray = Array.isArray(children) ? children : [children]

  return (
    <TxLayout title={title} {...txLayoutProps} step={step} onBack={onPrev} progress={progress}>
      {childrenArray[step]}
    </TxLayout>
  )
}
