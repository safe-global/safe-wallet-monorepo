import type { ComponentProps, ReactElement } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { BLOCKED_LABEL } from './constants'

type BlockedBadgeProps = Omit<ComponentProps<typeof Badge>, 'variant' | 'size' | 'shape' | 'children'>

export const BlockedBadge = (props: BlockedBadgeProps): ReactElement => (
  <Badge variant="destructive" size="status" shape="status" {...props}>
    <X aria-hidden />
    {BLOCKED_LABEL}
  </Badge>
)
