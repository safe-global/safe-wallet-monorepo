import { useState, type ReactElement, type ReactNode } from 'react'
import { Check, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { SCROLL_AREA } from '@safe-global/views/utils/styles'
import { cn } from '@safe-global/views/utils/cn'

export type DrawerSignatureRow = {
  id: string
  /** `not-needed`: the threshold was met without this signer. */
  status: 'created' | 'signed' | 'needed' | 'not-needed'
  /** Who: for `created` a name, otherwise the signer's identity (identicon, name, address). */
  signer: ReactNode
  /** When it was created or signed; shown on the row, or in the Signed badge's tooltip. */
  time?: string
  you?: boolean
  /** Trailing control on a `needed` row that isn't yours, such as Notify. Your own `needed` row asks for your signature. */
  action?: ReactNode
}

export type DrawerSignaturesProps = {
  /** Next to the title, such as `DrawerSignaturesBadge` or a signature gauge. */
  status: ReactNode
  rows: DrawerSignatureRow[]
  /** Muted text on the right of the title row, such as "6 days left". */
  meta?: ReactNode
  /** Icon buttons after the status, such as copy link. */
  actions?: ReactNode
  /** Folded by default so the body keeps most of the height. */
  defaultOpen?: boolean
}

/** The count or "Your signature required" next to the title. The app decides the text and tone. */
export const DrawerSignaturesBadge = ({
  tone,
  children,
}: {
  tone: 'success' | 'warning'
  children: ReactNode
}): ReactElement => (
  <Badge variant={tone} size="status" shape="status">
    {children}
  </Badge>
)

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
    <span
      className={cn(
        'flex min-w-0 items-center gap-1',
        ((row.status === 'needed' && row.you) || row.status === 'not-needed') && 'opacity-50',
      )}
    >
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

  if (row.status === 'not-needed') {
    return (
      <>
        {signer}
        <span className="sr-only">Not needed</span>
      </>
    )
  }

  return (
    <>
      {signer}
      {row.you ? <DrawerSignaturesBadge tone="warning">Your signature required</DrawerSignaturesBadge> : row.action}
    </>
  )
}

/** A line from each row to the next: solid once the next step happened, dashed while it's still missing. */
const lineFor = (next?: DrawerSignatureRow): 'done' | 'missing' | undefined =>
  next ? (next.status === 'signed' || next.status === 'created' ? 'done' : 'missing') : undefined

/** Who has signed, folded into one line above the drawer's actions. Goes in `DrawerFooter`'s `summary`. */
export const DrawerSignatures = ({
  status,
  rows,
  meta,
  actions,
  defaultOpen = false,
}: DrawerSignaturesProps): ReactElement => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible
      render={<section aria-label="Signatures" />}
      className="flex flex-col"
      open={open}
      onOpenChange={setOpen}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Signatures</span>
        {status}
        {actions}
        <span className="flex-1" />
        {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
        <CollapsibleTrigger
          render={<Button variant="ghost-muted" size="icon-sm" />}
          aria-label={open ? 'Hide signatures' : 'Show signatures'}
        >
          {open ? <ChevronDown /> : <ChevronUp />}
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent keepMounted className={cn(SCROLL_AREA, 'max-h-[28vh] flex-none overscroll-contain pt-3')}>
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
      </CollapsibleContent>
    </Collapsible>
  )
}
