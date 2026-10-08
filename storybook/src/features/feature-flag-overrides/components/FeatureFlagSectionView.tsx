import { Fragment, type ReactElement, type ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { GRID } from './FeatureFlagRowView'
import type { FeatureFlagRowData } from '@/features/feature-flag-overrides/hooks/useFeatureFlagEditorData'

export type FeatureFlagSectionViewProps = {
  title: string
  rows: FeatureFlagRowData[]
  valueLabel: string
  renderRow: (row: FeatureFlagRowData) => ReactNode
}

export const FeatureFlagSectionView = ({
  title,
  rows,
  valueLabel,
  renderRow,
}: FeatureFlagSectionViewProps): ReactElement | null => {
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
          <Fragment key={row.feature}>{renderRow(row)}</Fragment>
        ))}
      </Card>
    </section>
  )
}
