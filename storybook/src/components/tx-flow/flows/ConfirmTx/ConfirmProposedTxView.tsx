import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'

const SIGN_TEXT = 'Sign this transaction.'
const EXECUTE_TEXT = 'Submit the form to execute this transaction.'
const SIGN_EXECUTE_TEXT = 'Sign or immediately execute this transaction.'

export type ConfirmProposedTxViewProps = {
  onlyExecute?: boolean
  isExecutable?: boolean
}

export const ConfirmProposedTxView = ({ onlyExecute, isExecutable }: ConfirmProposedTxViewProps): ReactElement => {
  const text = !onlyExecute ? (isExecutable ? SIGN_EXECUTE_TEXT : SIGN_TEXT) : EXECUTE_TEXT

  return <Typography className="mb-2">{text}</Typography>
}
