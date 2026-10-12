import { type ReactNode } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { gridFieldClass } from './constants'

// Title column sizing: xs auto, lg 170px, xl 25%, min 100px

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
      {/* max-w-full caps the value's flex minimum so wide values wrap below the title; xl is nowrap, so shrink instead */}
      <div data-testid="tx-data-row" className="max-w-full flex-1 xl:min-w-0">
        {children}
      </div>
    </div>
  )
}

export default FieldsGrid

export { gridFieldClass } from './constants'
