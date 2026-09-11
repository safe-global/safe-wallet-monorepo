import type { ReactElement, ReactNode } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { Badge, type badgeVariants } from '@/components/ui/badge'

export type TxStatusChipProps = {
  children: ReactNode
  color?: 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'error'
}

const colorToVariant: Record<
  NonNullable<TxStatusChipProps['color']>,
  NonNullable<VariantProps<typeof badgeVariants>['variant']>
> = {
  primary: 'default',
  secondary: 'secondary',
  info: 'info',
  warning: 'warning',
  success: 'success',
  error: 'destructive',
}

const TxStatusChip = ({ children, color = 'primary' }: TxStatusChipProps): ReactElement => {
  return <Badge variant={colorToVariant[color]}>{children}</Badge>
}

export default TxStatusChip
