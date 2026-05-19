import type { ReactNode } from 'react'
import { Card, CardActions, CardContent, Stack, type SxProps } from '@mui/material'
import css from '../styles.module.css'

const sxBase = {
  my: 2,
  border: '1px solid #f0f0f0',
  borderRadius: '24px',
  boxShadow: 'none',
  overflow: 'visible',
}

const TxCard = ({ children, sx = {} }: { children: ReactNode; sx?: SxProps }) => {
  return (
    <Card sx={{ ...sxBase, ...sx }}>
      <CardContent data-testid="card-content" className={css.cardContent}>
        {children}
      </CardContent>
    </Card>
  )
}

export default TxCard

export const TxCardActions = ({ children, sx }: { children: ReactNode; sx?: SxProps }) => {
  return (
    <CardActions sx={{ ...sx, padding: '16px 0 0 0' }}>
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
