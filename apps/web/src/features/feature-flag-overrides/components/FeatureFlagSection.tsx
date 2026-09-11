import type { ReactElement } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { FeatureFlagRow, GRID } from './FeatureFlagRow'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'

export const FeatureFlagSection = ({
  title,
  rows,
  valueLabel,
}: {
  title: string
  rows: FeatureFlagRowData[]
  valueLabel: string
}): ReactElement | null => {
  if (rows.length === 0) return null
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">{title}</span>
        <Badge variant="secondary">{rows.length}</Badge>
      </div>

      <Card size="none">
        <div
          className={cn(
            GRID,
            'text-muted-foreground border-b px-5 py-2 text-[10.5px] font-semibold tracking-wide uppercase [&>:last-child]:text-right',
          )}
        >
          <span>Feature flag</span>
          <span>Config service</span>
          <span>{valueLabel}</span>
        </div>

        {rows.map((row) => (
          <FeatureFlagRow key={row.feature} row={row} />
        ))}
      </Card>
    </section>
  )
}

export default FeatureFlagSection
