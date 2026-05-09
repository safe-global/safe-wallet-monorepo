import type { ReactNode } from 'react'

export type SubmitCallback = (txId: string, isExecuted?: boolean) => void

export type SignOrExecuteProps = {
  txId?: string
  onSubmit?: SubmitCallback
  children?: ReactNode
  isExecutable?: boolean
  isRejection?: boolean
  onlyExecute?: boolean
  disableSubmit?: boolean
  origin?: string
  tooltip?: string
  isMassPayout?: boolean
}
