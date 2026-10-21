import { useRef, type ReactNode } from 'react'
import {
  ArrowUpRight,
  ArrowRightLeft,
  FileCode2,
  Network,
  Repeat2,
  Settings,
  CircleX,
  CircleCheck,
  PenLine,
  Clock3,
  Users,
  Layers,
  Split,
  type LucideIcon,
  Info,
} from 'lucide-react'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Badge, BadgeDot } from '@safe-global/views/components/ui/badge'
import { Tag } from '@safe-global/views/components/ui/tag'
import Identicon from '@/components/common/Identicon'
import { getStepsStatus, type TypeLabel } from '../services/model'
import { TYPE_HINTS } from '../services/columns'
import type { Filter, Persona, Proposal } from '../types'

// Blocked comes before Waiting on others: you can act on what blocks it.
export const STATUS_ORDER: Filter[] = ['ready', 'sign', 'waiting', 'awaiting']
export const CONFLICTING_META = {
  short: 'Conflicting',
  icon: Split,
}
export const STATUS_META: Record<Filter, { label: string; icon: LucideIcon; tone: string }> = {
  ready: {
    label: 'Ready to execute',
    icon: CircleCheck,
    tone: 'bg-success-subtle text-success-strong',
  },
  sign: {
    label: 'Ready to sign',
    icon: PenLine,
    tone: 'bg-success-subtle text-success-strong',
  },
  awaiting: {
    label: 'Waiting on others',
    icon: Users,
    tone: 'bg-warning-subtle text-warning-strong',
  },
  waiting: {
    label: 'Blocked',
    icon: Clock3,
    tone: 'bg-warning-subtle text-warning-strong',
  },
}

export const TYPE_ICONS: Record<TypeLabel, LucideIcon> = {
  Send: ArrowUpRight,
  Swap: Repeat2,
  Bridge: ArrowRightLeft,
  Batch: Layers,
  Contract: FileCode2,
  Settings,
  Nested: Network,
  'On-chain rejection': CircleX,
}

// Recoveries are not proposals. They have their own Type filter label.
export const RECOVERY_TYPE = 'Account recovery'

export const chainLogoUrl = (chainId: string | undefined) =>
  `https://safe-transaction-assets.safe.global/chains/${chainId}/chain_logo.png`

export function SafeIdentity({
  address,
  size,
  className,
  children,
  title,
  details,
}: {
  address: string
  size: number
  className: string
  children: ReactNode
  // Optional heading above the address.
  title?: string
  // Optional facts listed below the address.
  details?: { label: string; value: ReactNode }[]
}) {
  const avatarRef = useRef<HTMLSpanElement>(null)
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={<div className={className} />}>
        <span ref={avatarRef} className="flex shrink-0">
          <Identicon address={address} size={size} />
        </span>
        {children}
      </TooltipTrigger>
      <TooltipContent anchor={avatarRef} className={title ? HINT_CLASS : 'break-all font-mono'}>
        {title ? <HintContent title={title} body={<span className="break-all font-mono">{address}</span>} /> : address}
        {details && (
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            {details.map(({ label, value }) => (
              <div key={label} className="contents">
                <dt className="opacity-70">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

// Icon tooltip: a short title, then one sentence.
export function HintContent({ title, body }: { title: string; body?: ReactNode }) {
  return (
    <>
      <p className="font-medium">{title}</p>
      {body && <p className="mt-1 leading-relaxed">{body}</p>}
    </>
  )
}
export const HINT_CLASS = 'max-w-xs whitespace-normal'

export type StatusTone = 'success' | 'warning' | 'destructive' | 'secondary'

// The status pill for the page: a dot and a label, as in the Policies prototype.
export function StatusChip({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <Badge variant={tone} size="status" shape="status">
      <BadgeDot />
      {children}
    </Badge>
  )
}

// The status chip. An info icon marks a row that executes after an earlier nonce. The chip tooltip explains it.
export function StepsStatusChip({ tx, persona }: { tx: Proposal; persona: Persona }) {
  const { label, tone, after } = getStepsStatus(tx, persona)
  return (
    <span className="flex min-w-0 items-center gap-1">
      <StatusChip tone={tone}>{label}</StatusChip>
      {after !== undefined && (
        <Info
          className="size-3.5 shrink-0 text-muted-foreground"
          strokeWidth={ICON_STROKE}
          aria-label={`Executes after #${after}`}
        />
      )}
    </span>
  )
}

// On a hovered or selected row the tag turns card-coloured, so it doesn't vanish into the row fill.
export const ROW_TAG_FILL = 'group-hover/transaction:*:bg-card group-data-[state=selected]/transaction:*:bg-card'

// A transaction's type as a tag: its icon and name, like the Type filter. The tooltip says what the type means.
export function TypeTag({ type, onRow = false }: { type: TypeLabel; onRow?: boolean }) {
  const Icon = TYPE_ICONS[type]
  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        render={<span className={`flex shrink-0 ${onRow ? ROW_TAG_FILL : ''}`} role="img" />}
        aria-label={`${type}. ${TYPE_HINTS[type]}`}
      >
        <Tag>
          <Icon strokeWidth={ICON_STROKE} aria-hidden="true" />
          {type}
        </Tag>
      </TooltipTrigger>
      <TooltipContent className={HINT_CLASS}>
        <HintContent title={type} body={TYPE_HINTS[type]} />
      </TooltipContent>
    </Tooltip>
  )
}
