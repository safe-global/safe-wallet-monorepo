import { Stack, type StackProps, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import isString from 'lodash/isString'
import isNumber from 'lodash/isNumber'

const gridSx = {
  width: { xl: '25%', lg: '150px', xs: 'auto' },
  minWidth: { xl: '25%', lg: '150px' },
  flexWrap: { xl: 'nowrap' },
}

const TxDetailsRow = ({
  label,
  children,
  direction = 'row',
  grid = false,
}: {
  label: string
  children: ReactNode
  direction?: StackProps['direction']
  grid?: boolean
}) => (
  <Stack
    gap={1}
    direction={direction}
    justifyContent={grid ? 'flex-start' : 'space-between'}
    flexWrap={direction === 'row' ? 'wrap' : 'initial'}
    alignItems={direction === 'row' ? 'center' : 'initial'}
  >
    <Typography variant="body2" color="text.secondary" sx={grid ? gridSx : undefined}>
      {label}
    </Typography>

    {isString(children) || isNumber(children) ? <Typography variant="body2">{children}</Typography> : children}
  </Stack>
)

export default TxDetailsRow
