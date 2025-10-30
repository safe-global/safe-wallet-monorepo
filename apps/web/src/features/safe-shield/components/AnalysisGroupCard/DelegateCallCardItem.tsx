import { Link } from '@mui/material'
import { type Severity } from '@safe-global/utils/features/safe-shield/types'
import { AnalysisGroupCardItem } from './AnalysisGroupCardItem'
import { type ReactElement } from 'react'

interface DelegateCallCardItemProps {
  children?: React.ReactNode
  severity?: Severity
}

export const DelegateCallCardItem = ({ children, severity }: DelegateCallCardItemProps): ReactElement => {
  const description = (
    <>
      This transaction calls a smart contract that will be able to modify your Safe account.{' '}
      <Link
        href="https://help.safe.global/en/articles/40794-why-do-i-see-an-unexpected-delegate-call-warning-in-my-transaction"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn more
      </Link>
    </>
  )

  return (
    <AnalysisGroupCardItem severity={severity} description={description}>
      {children}
    </AnalysisGroupCardItem>
  )
}
