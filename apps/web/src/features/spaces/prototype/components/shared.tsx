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
import Identicon from '@/components/common/Identicon'
import { getStepsStatus, type TypeLabel } from '../services/model'
import type { Filter, Persona, Proposal } from '../types'

export const STATUS_ORDER: Filter[] = ['ready', 'sign', 'awaiting', 'waiting']
export const QUICK_FILTERS: Filter[] = ['sign', 'ready', 'waiting']
// Next steps: conflicting transactions have their own section, above all statuses.
export const CONFLICTING_META = {
  label: 'Conflicting transactions',
  short: 'Conflicting',
  description: 'Proposals that share a nonce. Only one per nonce can execute',
  icon: Split,
}
export const STATUS_META: Record<Filter, { label: string; description: string; icon: LucideIcon; tone: string }> = {
  ready: {
    label: 'Ready to execute',
    description: 'Fully signed and next in line',
    icon: CircleCheck,
    tone: 'bg-success-subtle text-success-strong',
  },
  sign: {
    label: 'Ready to sign',
    description: 'Proposals waiting for you to sign',
    icon: PenLine,
    tone: 'bg-success-subtle text-success-strong',
  },
  awaiting: {
    label: 'Waiting on others',
    description: 'Waiting on other signers',
    icon: Users,
    tone: 'bg-warning-subtle text-warning-strong',
  },
  waiting: {
    label: 'Blocked',
    description: 'Waiting on an earlier transaction',
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
  Update: Settings,
  Nested: Network,
  'On-chain rejection': CircleX,
}

// Next steps: recoveries are not proposals. They have their own Type filter label.
export const RECOVERY_TYPE = 'Account recovery'

export type GroupBy = 'none' | 'status' | 'safe'

export const chainLogoUrl = (chainId: string | undefined) =>
  `https://safe-transaction-assets.safe.global/chains/${chainId}/chain_logo.png`

export function SafeIdentity({
  address,
  size,
  className,
  children,
  title,
}: {
  address: string
  size: number
  className: string
  children: ReactNode
  // Optional heading above the address.
  title?: string
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

// Next steps: the status chip. An info icon marks a row that executes after an earlier nonce. The chip tooltip explains it.
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
