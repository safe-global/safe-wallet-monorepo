import React, { type ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import SpeedIcon from '@/public/images/settings/spending-limit/speed.svg'

const SpendingLimitLabel = ({
  label,
  isOneTime = false,
  className,
  ...rest
}: { label: string | ReactElement; isOneTime?: boolean } & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`} {...rest}>
      {!isOneTime && <SpeedIcon className="size-6 text-[var(--color-border-main)]" />}
      {typeof label === 'string' ? <Typography>{label}</Typography> : label}
    </div>
  )
}

export default SpendingLimitLabel
