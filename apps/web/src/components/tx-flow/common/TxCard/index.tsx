import type { ReactNode } from 'react'
import { Card, CardActions, CardContent, Stack } from '@mui/material'
import css from '../styles.module.css'

const sx = { my: 2, border: 0 }

const TxCard = ({ children }: { children: ReactNode }) => {
  return (
    <Card sx={sx}>
      <CardContent data-testid="card-content" className={css.cardContent}>
        {children}
      </CardContent>
    </Card>
  )
}

export default TxCard

export const TxCardActions = ({ children }: { children: ReactNode }) => {
  return (
    <CardActions>
      <Stack
        sx={{
          width: ['100%', '100%', '100%', 'auto'],
        }}
        direction={{ xs: 'column-reverse', lg: 'row' }}
        spacing={{ xs: 2, md: 2 }}
      >
        {children}
      </Stack>
    </CardActions>
  )
}
