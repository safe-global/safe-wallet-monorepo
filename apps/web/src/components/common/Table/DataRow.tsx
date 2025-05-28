import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@mui/material'
import FieldsGrid from '@/components/tx/FieldsGrid'

type DataRowProps = {
  datatestid?: String
  title: ReactNode
  children?: ReactNode
}

export const DataRow = ({ datatestid, title, children }: DataRowProps): ReactElement | null => {
  if (children == undefined) return null

  return (
    <FieldsGrid data-testid={datatestid} title={title}>
      <Typography variant="body1" component="div">
        {children}
      </Typography>
    </FieldsGrid>
  )
}
