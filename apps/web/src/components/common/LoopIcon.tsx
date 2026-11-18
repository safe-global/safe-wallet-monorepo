import { RotateCw } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@safe-global/views/utils/cn'

export const LoopIcon = ({ className, ...props }: ComponentProps<'svg'>) => {
  return <RotateCw className={cn('animate-spin', className)} {...props} />
}
