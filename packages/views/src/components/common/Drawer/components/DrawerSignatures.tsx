import { useId, useState, type ReactElement, type ReactNode } from 'react'
import { Check, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { SCROLL_AREA } from '@safe-global/views/utils/styles'
import { cn } from '@safe-global/views/utils/cn'

export type DrawerSignatureRow = {
  id: string
  status: 'created' | 'signed' | 'needed'
  /** Who: for `created` a name, otherwise the signer's identity (identicon, name, address). */
  signer: ReactNode
  /** When it was created or signed; shown on the row, or in the Signed badge's tooltip. */
  time?: string
  you?: boolean
  /** Trailing control on a `needed` row that isn't yours, such as Notify. */
  action?: ReactNode
}

export type DrawerSignaturesProps = {
  signed: number
  required: number
  rows: DrawerSignatureRow[]
  /** Muted text on the right of the title row, such as "6 days left". */
  meta?: ReactNode
  /** Icon buttons after the badge, such as copy link. */
  actions?: ReactNode
  /** Replaces the count badge, such as a signature gauge. */
  status?: ReactNode
  /** A line under the title row, such as "You aren't a signer of this Safe". */
  note?: ReactNode
  /** Folded by default so the body keeps most of the height. */
  defaultOpen?: boolean
  /** Pass with `onOpenChange` to control it, for "expand all" or to open it from a link. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const YOUR_SIGNATURE = 'Your signature required'

const SignedBadge = ({ time }: { time?: string }): ReactElement => {
  const badge = (
    <Badge variant="success" size="status" shape="status" tabIndex={time ? 0 : undefined}>
      <Check aria-hidden />
      Signed
    </Badge>
  )
  if (!time) return badge

  return (
    <Tooltip>
      <TooltipTrigger render={badge} />
      <TooltipContent>Signed on {time}</TooltipContent>
    </Tooltip>
  )
}

const RowContent = ({ row }: { row: DrawerSignatureRow }): ReactElement => {
  if (row.status === 'created') {
    return (
      <>
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted" aria-hidden>
            <Plus className="size-3.5 text-muted-foreground" />
          </span>
          <span className="truncate text-sm">Created by {row.signer}</span>
        </span>
        {row.time && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{row.time}</span>}
      </>
    )
  }

  const signer = (
    <span className={cn('flex min-w-0 items-center gap-1', row.status === 'needed' && row.you && 'opacity-50')}>
      {row.signer}
      {row.you && <span className="shrink-0 text-sm text-muted-foreground">(you)</span>}
    </span>
  )

  if (row.status === 'signed') {
    return (
      <>
        {signer}
        <SignedBadge time={row.time} />
      </>
    )
  }

  return (
    <>
      {signer}
      {row.you ? (
        <Badge variant="warning" size="status" shape="status">
          {YOUR_SIGNATURE}
        </Badge>
      ) : (
        row.action
      )}
    </>
  )
}

/** A line from each row to the next: solid once the next step happened, dashed while it's still missing. */
const lineFor = (next?: DrawerSignatureRow): 'done' | 'missing' | undefined =>
  next ? (next.status === 'needed' ? 'missing' : 'done') : undefined

/** Who has signed, folded into one line above the drawer's actions. Goes in `DrawerFooter`'s `summary`. */
export const DrawerSignatures = ({
  signed,
  required,
  rows,
  meta,
  actions,
  status,
  note,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: DrawerSignaturesProps): ReactElement => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const open = controlledOpen ?? uncontrolledOpen
  const toggle = () => {
    setUncontrolledOpen(!open)
    onOpenChange?.(!open)
  }
  const listId = useId()
  const complete = signed >= required
  const yourTurn = rows.some((row) => row.status === 'needed' && row.you)

  const badgeLabel = complete
    ? `${signed} of ${required} signed`
    : yourTurn
      ? YOUR_SIGNATURE
      : `${signed} of ${required} required`

  return (
    <section aria-label="Signatures" className="flex flex-col">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Signatures</span>
        {/* Your own row says it once the list is open */}
        {status ??
          (!(yourTurn && open) && (
            <Badge variant={complete ? 'success' : 'warning'} size="status" shape="status">
              {badgeLabel}
            </Badge>
          ))}
        {actions}
        <span className="flex-1" />
        {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
        <button
          type="button"
          aria-label={open ? 'Hide signatures' : 'Show signatures'}
          aria-expanded={open}
          aria-controls={listId}
          onClick={toggle}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {open ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </button>
      </div>

      {note && <p className="text-xs text-muted-foreground">{note}</p>}

      <div id={listId} hidden={!open} className={cn(SCROLL_AREA, 'max-h-[28vh] flex-none overscroll-contain pt-3')}>
        <ul className="flex flex-col gap-3">
          {rows.map((row, index) => {
            const line = lineFor(rows[index + 1])
            return (
              <li key={row.id} className="relative flex h-10 items-center justify-between gap-3">
                <RowContent row={row} />
                {line && (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute top-[34px] left-[11.5px] h-6 border-l',
                      line === 'done' ? 'border-border' : 'border-dashed border-muted-foreground/40',
                    )}
                  />
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
