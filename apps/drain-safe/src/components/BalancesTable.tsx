import { useMemo, useState } from 'react'
import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Stack,
  type SxProps,
  type Theme,
} from '@mui/material'
import type { TokenBalance } from '@safe-global/safe-apps-sdk'
import { formatTokenAmount } from '../utils/format'
import FiatValue from './FiatValue'
import TokenIcon from './TokenIcon'

type Column = 'asset' | 'amount' | 'value'
type Sort = { column: Column; direction: 'asc' | 'desc' }

const COLUMNS: { id: Column; label: string }[] = [
  { id: 'asset', label: 'Asset' },
  { id: 'amount', label: 'Amount' },
  { id: 'value', label: 'Value' },
]

const outlined: SxProps<Theme> = {
  border: 1,
  borderColor: 'divider',
  borderRadius: 1,
  '& .MuiTableBody-root .MuiTableCell-root': { borderBottom: 1, borderColor: 'divider', py: 1.5 },
  '& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root': { borderBottom: 0 },
}

const columnSeparator: SxProps<Theme> = {
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '35%',
    height: '30%',
    borderLeft: 1,
    borderColor: 'divider',
  },
}

const amountOf = (item: TokenBalance) => Number(formatTokenAmount(item.balance, item.tokenInfo.decimals))

const compare: Record<Column, (a: TokenBalance, b: TokenBalance) => number> = {
  asset: (a, b) => a.tokenInfo.name.localeCompare(b.tokenInfo.name),
  amount: (a, b) => amountOf(a) - amountOf(b),
  value: (a, b) => Number(a.fiatBalance) - Number(b.fiatBalance),
}

const nextSort = (current: Sort | undefined, column: Column): Sort =>
  current?.column === column && current.direction === 'desc'
    ? { column, direction: 'asc' }
    : { column, direction: 'desc' }

type Props = {
  assets: TokenBalance[]
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  gasPrice: bigint
  nativeFiatPrice: number
}

function BalancesTable({ assets, selected, onSelectionChange, gasPrice, nativeFiatPrice }: Props) {
  const [sort, setSort] = useState<Sort>()

  const rows = useMemo(() => {
    if (!sort) return assets
    const sign = sort.direction === 'asc' ? 1 : -1
    return [...assets].sort((a, b) => sign * compare[sort.column](a, b))
  }, [assets, sort])

  const allSelected = selected.length === assets.length

  const toggle = (address: string) =>
    onSelectionChange(selected.includes(address) ? selected.filter((item) => item !== address) : [...selected, address])

  return (
    <TableContainer sx={outlined}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={allSelected}
                indeterminate={selected.length > 0 && !allSelected}
                onChange={() => onSelectionChange(allSelected ? [] : assets.map((item) => item.tokenInfo.address))}
                slotProps={{ input: { 'aria-label': 'Select all assets' } }}
              />
            </TableCell>
            {COLUMNS.map(({ id, label }) => (
              <TableCell key={id} sortDirection={sort?.column === id ? sort.direction : false} sx={columnSeparator}>
                <TableSortLabel
                  active={sort?.column === id}
                  direction={sort?.column === id ? sort.direction : 'desc'}
                  onClick={() => setSort(nextSort(sort, id))}
                >
                  {label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((item) => (
            <TableRow key={item.tokenInfo.address}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selected.includes(item.tokenInfo.address)}
                  onChange={() => toggle(item.tokenInfo.address)}
                  slotProps={{ input: { 'aria-label': `Select ${item.tokenInfo.name}` } }}
                />
              </TableCell>
              <TableCell>
                <Stack direction="row" alignItems="center">
                  <TokenIcon logoUri={item.tokenInfo.logoUri} symbol={item.tokenInfo.symbol} />
                  {item.tokenInfo.name}
                </Stack>
              </TableCell>
              <TableCell>{formatTokenAmount(item.balance, item.tokenInfo.decimals)}</TableCell>
              <TableCell>
                <FiatValue item={item} gasPrice={gasPrice} nativeFiatPrice={nativeFiatPrice} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default BalancesTable
