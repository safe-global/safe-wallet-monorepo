import type { ReactNode } from 'react'
import { Card, CardContent } from '@mui/material'
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
