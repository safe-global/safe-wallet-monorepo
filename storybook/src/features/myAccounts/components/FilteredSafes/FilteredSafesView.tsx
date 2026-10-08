import type { ReactNode } from 'react'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { Typography } from '@/components/ui/typography'

export type FilteredSafesViewProps = {
  resultCount: number
  safesList: ReactNode
}

export const FilteredSafesView = ({ resultCount, safesList }: FilteredSafesViewProps) => {
  return (
    <>
      <Typography variant="paragraph" color="muted" className="mb-4">
        Found {resultCount} result{maybePlural(resultCount)}
      </Typography>
      <div className="mt-2">{safesList}</div>
    </>
  )
}
