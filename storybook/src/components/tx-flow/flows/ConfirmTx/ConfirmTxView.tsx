import type { ReactElement } from 'react'

export type ConfirmTxViewProps = {
  text: string
}

export const ConfirmTxView = ({ text }: ConfirmTxViewProps): ReactElement => <>{text}&nbsp;</>
