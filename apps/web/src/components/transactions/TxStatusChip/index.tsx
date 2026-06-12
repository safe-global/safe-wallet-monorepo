import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

export type TxStatusChipProps = {
  children: ReactNode
  color?: 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'error'
  backgroundColor?: string
}

const toCssVar = (path: string): string => `var(--color-${path.replace('.', '-')})`

const TxStatusChip = ({ children, color = 'primary', backgroundColor }: TxStatusChipProps): ReactElement => {
  const textShade = color === 'success' ? 'dark' : color === 'primary' ? 'light' : 'main'

  const style: CSSProperties = {
    backgroundColor: backgroundColor ? toCssVar(backgroundColor) : toCssVar(`${color}.background`),
    color: toCssVar(`${color}.${textShade}`),
  }

  return (
    <Badge className="h-6 rounded-2xl px-3 text-xs font-bold" style={style}>
      {children}
    </Badge>
  )
}

export default TxStatusChip
