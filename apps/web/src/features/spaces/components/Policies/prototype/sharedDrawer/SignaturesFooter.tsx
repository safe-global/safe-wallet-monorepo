import { useId, useState, type ReactElement, type ReactNode } from 'react'
import { Check, ChevronDown, ChevronUp, Copy, Plus } from 'lucide-react'
import { useAppDispatch } from '@/store'
import { SCROLL_AREA } from '@/utils/styles'
import { showNotification } from '@/store/notificationsSlice'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'
import { SafeAddress } from '../m2Prototype'
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
  /** Muted text on the right of the title row, e.g. how long is left to sign. */
  meta?: string
  /** Shown when hovering `meta`, e.g. the exact expiry time. */
  metaTooltip?: string
  actions: FooterActions
  onDismiss?: () => void
  padding?: HeaderPadding
  /** Picks the block explorer in the address tooltips. */
  chainId?: string
}

const CopyLinkButton = (): ReactElement => {
  const dispatch = useAppDispatch()
  const copy = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() =>
        dispatch(
          showNotification({ message: 'Link copied to clipboard', variant: 'info', groupKey: 'prototype-copy-link' }),
        ),
      )
      .catch(() => undefined)
  }

  return (
    <Tooltip {...TOOLTIP_TIMING}>
      <TooltipTrigger render={<Button variant="ghost-muted" size="icon-sm" aria-label="Copy link" onClick={copy} />}>
        <Copy />
      </TooltipTrigger>
      <TooltipContent>Copy link</TooltipContent>
    </Tooltip>
  )
}

const ROW_HEIGHT = 'h-10'

const YOUR_SIGNATURE = 'Your signature required'

/** 40px rows 12px apart, so the line runs 24px from under this avatar (34px) to above the next. */
const TimelineRow = ({ line, children }: { line?: 'done' | 'missing'; children: ReactNode }): ReactElement => (
  <li className={cn('relative flex items-center justify-between gap-3', ROW_HEIGHT)}>
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
    <SafeAddress
      name={name}
      address={address}
      chainId={chainId}
      nameSuffix={you ? <span className="text-sm text-muted-foreground">(you)</span> : undefined}
    />
  </span>
)

const RowContent = ({ row, chainId }: { row: SignatureRow; chainId: string }): ReactElement => {
  const [notified, setNotified] = useState(false)

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
        <Button variant="outline" size="xs" disabled={notified} onClick={() => setNotified(true)}>
          {notified ? 'Notified' : 'Notify'}
        </Button>
      )}
    </>
  )
}

export type FooterAction = {
  label: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost-destructive'
  disabled?: boolean
  /** Closes the panel, e.g. "Got it". */
  dismiss?: boolean
}

/** One or two buttons (the main one twice as wide) with M1's optional muted hint centred above them. */
export type FooterActions = { primary: FooterAction; secondary?: FooterAction; hint?: string }

const ActionRow = ({ primary, secondary, hint, onDismiss }: FooterActions & { onDismiss?: () => void }) => {
  const button = ({ label, variant = 'default', disabled, dismiss }: FooterAction, className: string) => (
    <Button variant={variant} disabled={disabled} className={className} onClick={dismiss ? onDismiss : undefined}>
      {label}
    </Button>
  )

  return (
    <div className="flex flex-col gap-2">
      {hint && <p className="text-center text-xs text-muted-foreground">{hint}</p>}
      <div className="flex gap-2">
        {secondary && button({ variant: 'outline', ...secondary }, 'flex-1')}
        {button(primary, secondary ? 'flex-[2]' : 'w-full')}
      </div>
    </div>
  )
}

/** A footer with only actions, e.g. "Got it" on a failed policy; same border and spacing as the signatures one. */
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

/** The queue panel's signers footer, pinned under the scrolling body of every panel that collects signatures. */
export const SignaturesFooter = ({
  signed,
  required,
  rows,
  meta,
  metaTooltip,
  actions,
  onDismiss,
  padding = 16,
  chainId = '1',
}: SignaturesFooterProps): ReactElement => {
  // Folded by default so the panel's content keeps most of the height on a laptop screen.
  const [open, setOpen] = useState(false)
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
        {/* 10px padding plus the 32px buttons' extra height puts the text 16px from the border and the line. */}
        <div className="flex items-center gap-2 py-2.5">
          <span className="text-sm font-medium">Signatures</span>
          {/* M1's SafeSignatureInfo badge; hidden when open, since your own row then shows it. */}
          {!(yourTurn && open) && (
            <Badge variant={complete ? 'success' : 'warning'} size="status" shape="status">
              {complete
                ? `${signed} of ${required} signed`
                : yourTurn
                  ? YOUR_SIGNATURE
                  : `${signed} of ${required} required`}
            </Badge>
          )}
          <CopyLinkButton />
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
          {/* Plain button: Button's ghost variants stay grey while aria-expanded is true. */}
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
                  <RowContent row={row} chainId={chainId} />
                </TimelineRow>
              )
            })}
          </ul>
        </div>
      </section>

      {/* 16px from the line to the buttons, matching the gaps above it and under the buttons. */}
      <Divider className="mb-4" />

      <ActionRow {...actions} onDismiss={onDismiss} />
    </footer>
  )
}
