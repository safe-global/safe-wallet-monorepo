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
  type LucideIcon,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import Identicon from '@/components/common/Identicon'
import type { TypeLabel } from '../services/model'
import type { Filter } from '../types'

export const STATUS_ORDER: Filter[] = ['ready', 'sign', 'awaiting', 'waiting']
export const QUICK_FILTERS: Filter[] = ['sign', 'ready', 'waiting']
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

export type GroupBy = 'none' | 'status' | 'safe'

export const chainLogoUrl = (chainId: string | undefined) =>
  `https://safe-transaction-assets.safe.global/chains/${chainId}/chain_logo.png`

export function SafeIdentity({
  address,
  size,
  className,
  children,
}: {
  address: string
  size: number
  className: string
  children: ReactNode
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
      <TooltipContent anchor={avatarRef} className="break-all font-mono">
        {address}
      </TooltipContent>
    </Tooltip>
  )
}
