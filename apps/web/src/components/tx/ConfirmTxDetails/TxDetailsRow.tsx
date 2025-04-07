import { Stack, type StackProps, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import isString from 'lodash/isString'
import isNumber from 'lodash/isNumber'
import { gridSx } from '../FieldsGrid'

const TxDetailsRow = ({
  label,
  children,
  grid = false,
}: {
  label: string
  children: ReactNode
  direction?: StackProps['direction']
  grid?: boolean
}) => (
  <Stack
    gap={1}
    direction="row"
    justifyContent={grid ? 'flex-start' : 'space-between'}
    flexWrap="wrap"
    alignItems="center"
  >
    <Typography variant="body2" color={grid ? 'primary.light' : 'text.secondary'} sx={grid ? gridSx : undefined}>
      {label}
    </Typography>

    {isString(children) || isNumber(children) ? <Typography variant="body2">{children}</Typography> : children}
  </Stack>
)

export default TxDetailsRow
