import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { InfoTooltip } from '@/components/common/InfoTooltip'

export type TotalAssetValueViewProps = {
  title?: string
  tooltipTitle?: string
  size?: 'md' | 'lg'
  action?: ReactNode
  /** The formatted total; the skeleton is shown while it is undefined. */
  value?: ReactNode
}

export const TotalAssetValueView = ({
  title = 'Total value',
  tooltipTitle,
  size = 'md',
  action,
  value,
}: TotalAssetValueViewProps) => {
  const fontSizeClass = size === 'lg' ? 'text-[44px]' : 'text-[24px]'

  return (
    <div>
      <Typography variant="paragraph" className="mb-1 font-bold">
        {title}
        {tooltipTitle && <InfoTooltip title={tooltipTitle} />}
      </Typography>
      <div className="flex flex-row items-end justify-between">
        <div className={`m-0 font-semibold leading-[1.2] ${fontSizeClass}`}>
          {value ?? <Skeleton className="h-[1.2em] w-[60px]" />}
        </div>
        {action}
      </div>
    </div>
  )
}
