import { type ReactNode } from 'react'
import { Grid, Typography } from '@mui/material'

export const gridSx = {
  width: { xl: '25%', lg: '170px', xs: 'auto' },
  minWidth: '100px',
  flexWrap: { xl: 'nowrap' },
}

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
    <Grid
      container
      sx={[
        {
          gap: 1,
          flexWrap: gridSx.flexWrap,
        },
      ]}
      data-testid={testId}
    >
      <Grid item data-testid="tx-row-title" style={{ wordBreak: 'break-word' }} sx={gridSx}>
        <Typography color="primary.light" variant="body2" component="span">
          {title}
        </Typography>
      </Grid>
      <Grid item xs data-testid="tx-data-row">
        {children}
      </Grid>
    </Grid>
  )
}

export default FieldsGrid
