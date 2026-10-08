import { type ReactElement, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { SafeItem } from '@/hooks/safes'
import SafeSearch from './SafeSearch'

/** Why a Safe can't be picked for a swap. */
export type SwapDisabledReason = 'unsupportedChain' | 'notActivated'

const SWAP_DISABLED_TOOLTIP: Record<SwapDisabledReason, string> = {
  unsupportedChain: 'Swap is not supported on this chain. Try another chain.',
  notActivated: 'This account is not activated yet and cannot swap.',
}

export type SafeCardSlotProps = {
  disabled: boolean
  disabledTooltip: string | undefined
  className: string
}

export type SelectSafeModalViewProps = {
  title: string
  query: string
  onQueryChange: (value: string) => void
  onClose: () => void
  isLoading: boolean
  safes: SafeItem[]
  getSwapDisabledReason: (safe: SafeItem) => SwapDisabledReason | undefined
  /** Renders the keyed SafeCardReadOnly for one Safe with the view's props spread onto it. */
  renderSafeCard: (safe: SafeItem, props: SafeCardSlotProps) => ReactNode
}

export const SelectSafeModalView = ({
  title,
  query,
  onQueryChange,
  onClose,
  isLoading,
  safes,
  getSwapDisabledReason,
  renderSafeCard,
}: SelectSafeModalViewProps): ReactElement => (
  <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
    <DialogContent padding="none" className="flex max-h-[520px] flex-col overflow-clip">
      <DialogHeader
        // eslint-disable-next-line no-restricted-syntax -- p-5 pb-0: bespoke header padding, no token
        className="shrink-0 p-5 pb-0"
      >
        <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
      </DialogHeader>

      <div className="shrink-0 px-4 py-3">
        <SafeSearch value={query} onChange={onQueryChange} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10">
        {isLoading ? (
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-[72px] w-full rounded-3xl" />
            <Skeleton className="h-[72px] w-full rounded-3xl" />
            <Skeleton className="h-[72px] w-full rounded-3xl" />
          </div>
        ) : safes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No safes found</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {safes.map((safe) => {
              const reason = getSwapDisabledReason(safe)
              const disabledTooltip = reason ? SWAP_DISABLED_TOOLTIP[reason] : undefined
              return renderSafeCard(safe, {
                disabled: Boolean(disabledTooltip),
                disabledTooltip,
                className: 'px-4 sm:px-4',
              })
            })}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
    </DialogContent>
  </Dialog>
)
