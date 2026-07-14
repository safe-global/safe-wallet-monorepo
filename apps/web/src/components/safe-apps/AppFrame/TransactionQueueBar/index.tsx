import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Dispatch, ReactElement, SetStateAction } from 'react'
import { X } from 'lucide-react'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import useTxQueue from '@/hooks/useTxQueue'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import styles from './styles.module.css'
import { getQueuedTransactionCount } from '@/utils/transactions'
import { BatchExecuteHoverProvider } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import BatchExecuteButton from '@/components/transactions/BatchExecuteButton'

type Props = {
  expanded: boolean
  visible: boolean
  setExpanded: Dispatch<SetStateAction<boolean>>
  onDismiss: () => void
  transactions: QueuedItemPage
}

const TransactionQueueBar = ({
  expanded,
  visible,
  setExpanded,
  onDismiss,
  transactions,
}: Props): ReactElement | null => {
  if (!visible || transactions.results.length === 0) {
    return null
  }

  const queuedTxCount = getQueuedTransactionCount(transactions)

  // if you inline the expression, it will split put the `queuedTxCount` on a new line
  // and make it harder to find this text for matchers in tests
  const barTitle = `(${queuedTxCount}) Transaction queue`
  return (
    <>
      <div className={styles.barWrapper}>
        <Accordion
          value={expanded ? ['queue'] : []}
          onValueChange={(value) => setExpanded(value.includes('queue'))}
          className="rounded-bl-none rounded-br-none"
        >
          <AccordionItem value="queue" className="relative border-b-0">
            <AccordionTrigger
              aria-label="expand transaction queue bar"
              className="pl-4 pr-12"
              style={{ height: TRANSACTION_BAR_HEIGHT }}
            >
              <Typography variant="paragraph-bold" className="mr-auto text-[var(--color-primary-main)]">
                {barTitle}
              </Typography>
            </AccordionTrigger>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDismiss}
              aria-label="dismiss transaction queue bar"
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X />
            </Button>
            <AccordionContent keepMounted className="px-4">
              <BatchExecuteHoverProvider>
                <div className="flex flex-col items-end">
                  <BatchExecuteButton />
                </div>
                <PaginatedTxns useTxns={useTxQueue} />
              </BatchExecuteHoverProvider>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      {expanded && (
        <div className="fixed inset-0 z-[var(--z-overlay)] bg-black/50" onClick={() => setExpanded(false)} />
      )}
    </>
  )
}

export const TRANSACTION_BAR_HEIGHT = '64px'

export default TransactionQueueBar
