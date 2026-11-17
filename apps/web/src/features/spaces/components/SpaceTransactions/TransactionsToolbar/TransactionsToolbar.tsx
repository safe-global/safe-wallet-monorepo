import type { ReactElement } from 'react'
import NewTransactionButton from '../NewTransactionButton'

const TransactionsToolbar = ({ spaceId }: { spaceId: string }): ReactElement => (
  <div className="flex justify-end">
    <NewTransactionButton spaceId={spaceId} />
  </div>
)

export default TransactionsToolbar
