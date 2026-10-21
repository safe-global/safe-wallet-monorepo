// Ported from #9133 Policies/prototype/sharedDrawer; keep names and props in sync.
import { useId, useState, type ReactElement, type ReactNode } from 'react'
import { Check, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { SCROLL_AREA } from '@/utils/styles'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'
import { IdentityRow } from '../ReviewDrawer/steps/IdentityRow'
import { Divider } from './PanelBody'
import { TOOLTIP_TIMING, type HeaderPadding } from './SharedDrawerHeader'

export type SignatureRow =
  | { kind: 'created'; name: string; time: string }
  | { kind: 'signed'; name: string; address: string; time: string; you?: boolean }
  | { kind: 'needed'; name: string; address: string; you?: boolean }

export type SignaturesFooterProps = {
  signed: number
  required: number
  rows: SignatureRow[]
  meta?: string
  metaTooltip?: string
  // Queue: replaces the badge text, e.g. "1 more from 2 signers".
  summary?: string
  actions?: FooterActions
  onDismiss?: () => void
  padding?: HeaderPadding
  chainId?: string
  // Queue: controlled so the list stays open while stepping through transactions.
  open?: boolean
  onOpenChange?: (open: boolean) => void
  // Queue: Notify on a needed row; one reminder goes to every missing signer.
  onNotify?: () => void
  notified?: boolean
  // Queue: a muted line under the list, e.g. "You aren't a signer of Ops."
  note?: ReactNode
  copyLink?: ReactNode
  // Queue: replaces the action row, e.g. with a confirm step.
  children?: ReactNode
}

const YOUR_SIGNATURE = 'Your signature required'

const TimelineRow = ({ line, children }: { line?: 'done' | 'missing'; children: ReactNode }): ReactElement => (
  <li className="relative flex h-10 items-center justify-between gap-3">
    {children}
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

const Signer = ({
  name,
  address,
  you,
  muted,
  chainId,
}: {
  name: string
  address: string
  you?: boolean
  muted?: boolean
  chainId: string
}): ReactElement => (
  <span className={cn('min-w-0', muted && 'opacity-50')}>
    <IdentityRow name={you ? `${name} (you)` : name} address={address} chainId={chainId} />
  </span>
)

const RowContent = ({
  row,
  chainId,
  onNotify,
  notified,
}: {
  row: SignatureRow
  chainId: string
  onNotify?: () => void
  notified?: boolean
}): ReactElement => {
  if (row.kind === 'created') {
    return (
      <>
        <span className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-muted" aria-hidden>
            <Plus className="size-3.5 text-muted-foreground" />
          </span>
          <span className="text-sm">Created by {row.name}</span>
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">{row.time}</span>
      </>
    )
  }

  if (row.kind === 'signed') {
    return (
      <>
        <Signer name={row.name} address={row.address} you={row.you} chainId={chainId} />
        <Tooltip {...TOOLTIP_TIMING}>
          <TooltipTrigger
            render={<Badge variant="success" size="status" shape="status" tabIndex={0} className="cursor-default" />}
          >
            <Check aria-hidden />
            Signed
          </TooltipTrigger>
          <TooltipContent>Signed on {row.time}</TooltipContent>
        </Tooltip>
      </>
    )
  }

  return (
    <>
      <Signer name={row.name} address={row.address} you={row.you} muted={row.you} chainId={chainId} />
      {row.you ? (
        <Badge variant="warning" size="status" shape="status">
          {YOUR_SIGNATURE}
        </Badge>
      ) : (
        onNotify && (
          <Button variant="outline" size="xs" onClick={onNotify}>
            {notified ? 'Notify again' : 'Notify'}
          </Button>
        )
      )}
    </>
  )
}

export type FooterAction = {
  label: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'ghost-destructive'
  disabled?: boolean
  dismiss?: boolean
  // Queue: real handlers; hers are inert.
  onClick?: () => void
}

// Queue: a secondary slot that opens a menu, e.g. "More actions".
export type FooterMenu = {
  label: string
  variant?: FooterAction['variant']
  items: { label: string; onClick: () => void }[]
}

export type FooterActions = { primary?: FooterAction; secondary?: FooterAction | FooterMenu; hint?: string }

const isMenu = (action: FooterAction | FooterMenu): action is FooterMenu => 'items' in action

export const ActionRow = ({ primary, secondary, hint, onDismiss }: FooterActions & { onDismiss?: () => void }) => {
  const button = ({ label, variant = 'default', disabled, dismiss, onClick }: FooterAction, className: string) => (
    <Button variant={variant} disabled={disabled} className={className} onClick={dismiss ? onDismiss : onClick}>
      {label}
    </Button>
  )
  const secondaryClass = primary ? 'flex-1' : 'w-full'

  return (
    <div className="flex flex-col gap-2">
      {hint && <p className="text-center text-xs text-muted-foreground">{hint}</p>}
      <div className="flex gap-2">
        {secondary &&
          (isMenu(secondary) ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant={secondary.variant ?? 'outline'} className={secondaryClass} />}
              >
                {secondary.label}
                <ChevronDown />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-auto min-w-56 whitespace-nowrap">
                {secondary.items.map((item) => (
                  <DropdownMenuItem key={item.label} onClick={item.onClick}>
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            button({ variant: 'outline', ...secondary }, secondaryClass)
          ))}
        {primary && button(primary, secondary ? 'flex-[2]' : 'w-full')}
      </div>
    </div>
  )
}

export const ActionFooter = ({
  actions,
  onDismiss,
  padding = 16,
}: {
  actions: FooterActions
  onDismiss?: () => void
  padding?: HeaderPadding
}): ReactElement => (
  <footer className={cn('flex shrink-0 flex-col border-t border-border bg-background', padding === 16 ? 'p-4' : 'p-6')}>
    <ActionRow {...actions} onDismiss={onDismiss} />
  </footer>
)

export const SignaturesFooter = ({
  signed,
  required,
  rows,
  meta,
  metaTooltip,
  summary,
  actions,
  onDismiss,
  padding = 16,
  chainId = '1',
  open: controlledOpen,
  onOpenChange,
  onNotify,
  notified,
  note,
  copyLink,
  children,
}: SignaturesFooterProps): ReactElement => {
  const [localOpen, setLocalOpen] = useState(false)
  const open = controlledOpen ?? localOpen
  const setOpen = (next: boolean) => (onOpenChange ? onOpenChange(next) : setLocalOpen(next))
  const listId = useId()
  const complete = signed >= required
  const yourTurn = rows.some((row) => row.kind === 'needed' && row.you)

  return (
    <footer
      className={cn(
        'flex shrink-0 flex-col border-t border-border bg-background',
        padding === 16 ? 'px-4 pb-4' : 'px-6 pb-6',
      )}
    >
      <section aria-label="Signatures">
        <div className="flex items-center gap-2 py-2.5">
          <span className="text-sm font-medium">Signatures</span>
          {!(yourTurn && open) && (
            <Badge variant={complete ? 'success' : 'warning'} size="status" shape="status">
              {complete
                ? `${signed} of ${required} signed`
                : yourTurn
                  ? YOUR_SIGNATURE
                  : (summary ?? `${signed} of ${required} required`)}
            </Badge>
          )}
          {copyLink}
          <span className="flex-1" />
          {meta &&
            (metaTooltip ? (
              <Tooltip {...TOOLTIP_TIMING}>
                <TooltipTrigger
                  render={
                    <span className="cursor-default text-xs text-muted-foreground underline decoration-dotted underline-offset-2" />
                  }
                >
                  {meta}
                </TooltipTrigger>
                <TooltipContent>{metaTooltip}</TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-xs text-muted-foreground">{meta}</span>
            ))}
          <button
            type="button"
            aria-label={open ? 'Hide signatures' : 'Show signatures'}
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen(!open)}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {open ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </button>
        </div>

        <div id={listId} hidden={!open} className={cn(SCROLL_AREA, 'max-h-[28vh] flex-none overscroll-contain pb-4')}>
          <ul className="flex flex-col gap-3">
            {rows.map((row, index) => {
              const next = rows[index + 1]
              return (
                <TimelineRow key={index} line={next ? (next.kind === 'needed' ? 'missing' : 'done') : undefined}>
                  <RowContent row={row} chainId={chainId} onNotify={onNotify} notified={notified} />
                </TimelineRow>
              )
            })}
          </ul>
          {note && <p className="pt-3 text-xs text-muted-foreground">{note}</p>}
        </div>
      </section>

      <Divider className="mb-4" />

      {children ?? (actions && <ActionRow {...actions} onDismiss={onDismiss} />)}
    </footer>
  )
}
