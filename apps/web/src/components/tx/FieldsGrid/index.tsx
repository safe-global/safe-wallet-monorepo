import { type ReactNode } from 'react'
import { Grid, Typography } from '@mui/material'

const width = { xl: '25%', lg: '150px', xs: 'auto' }
const minWidth = { xl: '25%', lg: '150px' }
const wrap = { flexWrap: { xl: 'nowrap' } }

const FieldsGrid = ({ title, children }: { title: string | ReactNode; children: ReactNode }) => {
  return (
    <Grid
      container
      sx={[
        {
          gap: 1,
        },
        ...(Array.isArray(wrap) ? wrap : [wrap]),
      ]}
    >
      <Grid
        item
        data-testid="tx-row-title"
        style={{ wordBreak: 'break-word' }}
        sx={{
          width,
          minWidth,
        }}
      >
        <Typography color="primary.light">{title}</Typography>
      </Grid>
      <Grid item xs data-testid="tx-data-row">
        {children}
      </Grid>
    </Grid>
  )
}

export default FieldsGrid
