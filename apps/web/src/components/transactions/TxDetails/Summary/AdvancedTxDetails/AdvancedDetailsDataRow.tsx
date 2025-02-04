import type { ReactElement, ReactNode } from 'react'
import Grid from '@mui/material/Grid2'

type AdvancedDetailsDataRowProps = {
  datatestid?: String
  title: ReactNode
  children?: ReactNode
}

export const AdvancedDetailsDataRow = ({
  datatestid,
  title,
  children,
}: AdvancedDetailsDataRowProps): ReactElement | null => {
  if (children == undefined) return null

  return (
    <Grid data-testid={datatestid} container spacing={0.5}>
      <Grid size={3} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
        {title}
      </Grid>
      <Grid size={9}>{children}</Grid>
    </Grid>
  )
}
