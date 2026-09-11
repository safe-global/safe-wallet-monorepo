import React, { type ReactElement } from 'react'
import { Clock } from 'lucide-react'
import { Typography } from '@/components/ui/typography'

const SpendingLimitLabel = ({
  label,
  isOneTime = false,
  className,
  ...rest
}: { label: string | ReactElement; isOneTime?: boolean } & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`} {...rest}>
      {!isOneTime && <Clock className="size-4 shrink-0 text-[var(--color-border-main)]" />}
      {typeof label === 'string' ? <Typography>{label}</Typography> : label}
    </div>
  )
}

export default SpendingLimitLabel
