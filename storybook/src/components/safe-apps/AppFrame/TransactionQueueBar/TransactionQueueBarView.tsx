import type { ReactElement, ReactNode } from 'react'
import { X } from 'lucide-react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { BatchExecuteHoverProvider } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import styles from './styles.module.css'

export const TRANSACTION_BAR_HEIGHT = '64px'

export type TransactionQueueBarViewProps = {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  onDismiss: () => void
  queuedTxCount: string
  batchExecuteButton: ReactNode
  txList: ReactNode
}

export function TransactionQueueBarView({
  expanded,
  onExpandedChange,
  onDismiss,
  queuedTxCount,
  batchExecuteButton,
  txList,
}: TransactionQueueBarViewProps): ReactElement {
  // Not inlined so the count stays on the title's line, where test matchers look for it
  const barTitle = `(${queuedTxCount}) Transaction queue`
  return (
    <>
      <div className={styles.barWrapper}>
        <Accordion
          value={expanded ? ['queue'] : []}
          onValueChange={(value) => onExpandedChange(value.includes('queue'))}
          className="rounded-bl-none rounded-br-none"
        >
          <AccordionItem value="queue" className="relative border-b-0">
            {/* items-center: the trigger's base items-start would top-align title and chevron in this fixed-height bar */}
            <AccordionTrigger
              aria-label="expand transaction queue bar"
              className="items-center pl-4 pr-12 **:data-[slot=accordion-trigger-icon]:rotate-180"
              style={{ height: TRANSACTION_BAR_HEIGHT }}
            >
              <Typography variant="paragraph-bold" className="mr-auto text-[var(--color-primary-main)]">
                {barTitle}
              </Typography>
            </AccordionTrigger>
            {/* Half the bar height pins the ✕ to the header strip; the item grows when the panel opens */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDismiss}
              aria-label="dismiss transaction queue bar"
              className="absolute right-2 -translate-y-1/2"
              style={{ top: `calc(${TRANSACTION_BAR_HEIGHT} / 2)` }}
            >
              <X />
            </Button>
            <AccordionContent keepMounted className="px-4">
              <BatchExecuteHoverProvider>
                <div className="flex flex-col items-end">{batchExecuteButton}</div>
                {txList}
              </BatchExecuteHoverProvider>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      {expanded && (
        <div data-testid="queue-bar-backdrop" className={styles.backdrop} onClick={() => onExpandedChange(false)} />
      )}
    </>
  )
}
