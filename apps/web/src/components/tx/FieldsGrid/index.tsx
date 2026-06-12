import { type ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

// Title column sizing: xs auto, lg 170px, xl 25%, min 100px
export const gridFieldClass = 'min-w-[100px] basis-auto lg:basis-[170px] xl:basis-1/4 xl:flex-nowrap'

const FieldsGrid = ({
  title,
  children,
  testId,
}: {
  title: string | ReactNode
  children: ReactNode
  testId?: string
}) => {
  return (
    <div className="flex flex-wrap gap-2 xl:flex-nowrap" data-testid={testId}>
      <div data-testid="tx-row-title" className={`break-words ${gridFieldClass}`}>
        <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
          {title}
        </Typography>
      </div>
      <div data-testid="tx-data-row" className="flex-1">
        {children}
      </div>
    </div>
  )
}

export default FieldsGrid
