import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import { X as CloseIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'
import Track from '@/components/common/Track'
import { BATCH_EVENTS } from '@/services/analytics/events/batching'
import PlusIcon from '@/public/images/common/plus.svg'
import EmptyBatch from '@views/features/batching/components/BatchSidebar/EmptyBatch'

export type BatchSidebarViewProps = {
  isOpen: boolean
  txCount: number
  txList: ReactNode
  checkWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  onClose: () => void
  onAddClick: (e: SyntheticEvent) => void
  onConfirmClick: (e: SyntheticEvent) => void
}

export const BatchSidebarView = ({
  isOpen,
  txCount,
  txList,
  checkWallet,
  onClose,
  onAddClick,
  onConfirmClick,
}: BatchSidebarViewProps) => {
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        overlayClassName="z-[var(--z-overlay)]"
        size="lg"
        padding="none"
        // eslint-disable-next-line no-restricted-syntax -- --z-overlay stacking (above sidebar) + gap-0 (kills base gap-4) + rounded-l-2xl partial-float radius
        className="z-[var(--z-overlay)] gap-0 rounded-l-2xl"
      >
        <aside className={css.aside}>
          <Typography variant="h4" className="pr-10 font-bold">
            Batched transactions
          </Typography>

          <Separator className="my-[var(--space-3)] w-full" />

          {txCount ? (
            <>
              <div className={css.txs}>{txList}</div>

              {checkWallet((isOk) => (
                <Track {...BATCH_EVENTS.BATCH_NEW_TX}>
                  <Button variant="ghost" onClick={onAddClick} disabled={!isOk}>
                    <PlusIcon className="mr-2 size-4" />
                    Add new transaction
                  </Button>
                </Track>
              ))}

              <Separator className="my-[var(--space-3)] w-full" />

              {checkWallet((isOk) => (
                <Track {...BATCH_EVENTS.BATCH_CONFIRM} label={txCount}>
                  <Button onClick={onConfirmClick} disabled={!txCount || !isOk} className="mt-[var(--space-1)]">
                    Confirm batch
                  </Button>
                </Track>
              ))}
            </>
          ) : (
            <EmptyBatch>
              {checkWallet((isOk) => (
                <Track {...BATCH_EVENTS.BATCH_NEW_TX}>
                  <Button onClick={onAddClick} disabled={!isOk}>
                    New transaction
                  </Button>
                </Track>
              ))}
            </EmptyBatch>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-[var(--space-2)] top-[var(--space-2)] z-[1] p-[var(--space-1)] text-[var(--color-border-main)]"
            aria-label="close"
            onClick={onClose}
          >
            <CloseIcon className="size-5" />
          </Button>
        </aside>
      </SheetContent>
    </Sheet>
  )
}
