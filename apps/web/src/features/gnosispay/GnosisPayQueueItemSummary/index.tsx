import { type ReactElement, type SyntheticEvent, useContext } from 'react'
import TxListAccordionItem from '@safe-global/views/components/transactions/TxListItem/TxListAccordionItem'
import DateTime from '@/components/common/DateTime'
import TxStatusChip from '@safe-global/views/components/transactions/TxStatusChip'
import { Button } from '@safe-global/views/components/ui/button'
import { type GnosisPayTxItem } from '../types'
import { TxModalContext } from '@/components/tx-flow'
import ExecuteGnosisPayTx from '../ExecuteGnosisPayTx'
import SkipExpiredGnosisPay from '../SkipExpiredGnosisPayTxs'
import { useNow } from '../hooks/useNow'

const noop = () => {}

export function GnosisPayQueueItemSummary({ item }: { item: GnosisPayTxItem }): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)
  const now = useNow()

  const remainingSeconds = Math.ceil((item.executableAt - now) / 1_000)
  const isExecutable = remainingSeconds <= 0
  const isExpired = item.expiresAt !== null && now >= item.expiresAt

  const onExecute = (e: SyntheticEvent) => {
    e.stopPropagation()
    setTxFlow(<ExecuteGnosisPayTx gnosisPayTx={item} />)
  }

  const onSkip = (e: SyntheticEvent) => {
    e.stopPropagation()
    setTxFlow(<SkipExpiredGnosisPay />)
  }

  const summary = (
    <div
      data-testid="transaction-item"
      className="grid min-w-0 flex-1 grid-cols-[auto_1fr] items-center gap-2 sm:grid-cols-[32px_minmax(0,1fr)_auto_auto]"
    >
      <div data-testid="nonce">{item.queueNonce}</div>

      <div data-testid="tx-type" className="truncate">
        Gnosis Pay Delay
      </div>

      <div data-testid="tx-date" className="text-muted-foreground">
        <DateTime value={item.executableAt} />
      </div>

      <div className="flex items-center justify-end gap-2">
        {isExpired ? (
          <>
            <TxStatusChip color="error">Expired</TxStatusChip>
            <Button onClick={onSkip}>Skip</Button>
          </>
        ) : (
          <>
            <TxStatusChip color={isExecutable ? 'success' : 'info'}>{isExecutable ? 'Ready' : 'Cooldown'}</TxStatusChip>
            <Button data-testid="execute-btn" onClick={onExecute} disabled={!isExecutable} className="tabular-nums">
              {isExecutable ? 'Execute' : `Execute in ${remainingSeconds}s`}
            </Button>
          </>
        )}
      </div>
    </div>
  )

  return <TxListAccordionItem value={[]} onValueChange={noop} summary={summary} details={null} />
}

export default GnosisPayQueueItemSummary
