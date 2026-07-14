import { type SyntheticEvent, useEffect } from 'react'
import { useCallback, useContext } from 'react'
import { X as CloseIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Typography } from '@/components/ui/typography'
import { useDraftBatch, useUpdateBatch } from '@/features/batching'
import css from './styles.module.css'
import { NewTxFlow } from '@/components/tx-flow/flows'
import { TxModalContext } from '@/components/tx-flow'
import { ConfirmBatchFlow } from '@/components/tx-flow/flows'
import Track from '@/components/common/Track'
import { BATCH_EVENTS } from '@/services/analytics'
import CheckWallet from '@/components/common/CheckWallet'
import PlusIcon from '@/public/images/common/plus.svg'
import EmptyBatch from './EmptyBatch'
import BatchTxList from './BatchTxList'

const BatchSidebar = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: (open: boolean) => void }) => {
  const { txFlow, setTxFlow } = useContext(TxModalContext)
  const batchTxs = useDraftBatch()
  const [, deleteTx] = useUpdateBatch()

  const closeSidebar = useCallback(() => {
    onToggle(false)
  }, [onToggle])

  const clearBatch = useCallback(() => {
    batchTxs.forEach((item) => deleteTx(item.id))
  }, [deleteTx, batchTxs])

  // Close confirmation flow when batch is empty
  const isConfirmationFlow = txFlow?.type === ConfirmBatchFlow
  const shouldExitFlow = isConfirmationFlow && batchTxs.length === 0
  useEffect(() => {
    if (shouldExitFlow) {
      setTxFlow(undefined)
    }
  }, [setTxFlow, shouldExitFlow])

  const onAddClick = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      setTxFlow(<NewTxFlow />, undefined, false)
    },
    [setTxFlow],
  )

  const onConfirmClick = useCallback(
    async (e: SyntheticEvent) => {
      e.preventDefault()
      if (!batchTxs.length) return
      closeSidebar()
      setTxFlow(<ConfirmBatchFlow onSubmit={clearBatch} />, undefined, false)
    },
    [setTxFlow, batchTxs, closeSidebar, clearBatch],
  )

  // Close sidebar when txFlow modal is opened
  useEffect(() => {
    if (txFlow) closeSidebar()
  }, [txFlow, closeSidebar])

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeSidebar()
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        overlayClassName="z-[100]"
        size="lg"
        padding="none"
        // eslint-disable-next-line no-restricted-syntax -- z-[100] stacking + gap-0 (kills base gap-4) + rounded-l-2xl partial-float radius; no tokens
        className="z-[100] gap-0 rounded-l-2xl"
      >
        <aside className={css.aside}>
          <Typography variant="h4" className="pr-10 font-bold">
            Batched transactions
          </Typography>

          <Separator className="my-[var(--space-3)] w-full" />

          {batchTxs.length ? (
            <>
              <div className={css.txs}>
                <BatchTxList txItems={batchTxs} onDelete={deleteTx} />
              </div>

              <CheckWallet>
                {(isOk) => (
                  <Track {...BATCH_EVENTS.BATCH_NEW_TX}>
                    <Button variant="ghost" onClick={onAddClick} disabled={!isOk}>
                      <PlusIcon className="mr-2 size-4" />
                      Add new transaction
                    </Button>
                  </Track>
                )}
              </CheckWallet>

              <Separator className="my-[var(--space-3)] w-full" />

              <CheckWallet>
                {(isOk) => (
                  <Track {...BATCH_EVENTS.BATCH_CONFIRM} label={batchTxs.length}>
                    <Button
                      onClick={onConfirmClick}
                      disabled={!batchTxs.length || !isOk}
                      className="mt-[var(--space-1)]"
                    >
                      Confirm batch
                    </Button>
                  </Track>
                )}
              </CheckWallet>
            </>
          ) : (
            <EmptyBatch>
              <CheckWallet>
                {(isOk) => (
                  <Track {...BATCH_EVENTS.BATCH_NEW_TX}>
                    <Button onClick={onAddClick} disabled={!isOk}>
                      New transaction
                    </Button>
                  </Track>
                )}
              </CheckWallet>
            </EmptyBatch>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-[var(--space-2)] top-[var(--space-2)] z-[1] p-[var(--space-1)] text-[var(--color-border-main)]"
            aria-label="close"
            onClick={closeSidebar}
          >
            <CloseIcon className="size-5" />
          </Button>
        </aside>
      </SheetContent>
    </Sheet>
  )
}

export default BatchSidebar
