import type { ReactElement } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ICON_STROKE } from '@/components/common/iconStroke'
import { cn } from '@/utils/cn'

const TONE_CLASSES = {
  destructive: 'text-destructive',
  success: 'text-accent-success',
  small: 'size-3.5',
}

export type TxIconTone = keyof typeof TONE_CLASSES

export type TxIconViewProps = {
  icon: LucideIcon
  className?: string
}

export const TxIconView = ({ icon: Icon, className }: TxIconViewProps) => (
  <Icon className={cn('size-4', className)} strokeWidth={ICON_STROKE} />
)

// Returns the element itself so callers can still read `icon` and `className` from its props
export const txIcon = (icon: LucideIcon, tone?: TxIconTone): ReactElement<TxIconViewProps> =>
  tone ? <TxIconView icon={icon} className={TONE_CLASSES[tone]} /> : <TxIconView icon={icon} />
