import { type ReactElement } from 'react'
import { Button, Typography } from '@mui/material'
import { SafeBalanceResponse } from '@gnosis.pm/safe-react-gateway-sdk'
import css from './styles.module.css'
import FiatValue from '@/components/common/FiatValue'
import TokenAmount, { TokenIcon } from '@/components/common/TokenAmount'
import EnhancedTable from '@/components/common/EnhancedTable'
import TokenExplorerLink from '../TokenExplorerLink'

interface AssetsTableProps {
  items?: SafeBalanceResponse['items']
}

const headCells = [
  {
    id: 'asset',
    label: 'Asset',
    width: '60%',
  },
  {
    id: 'balance',
    label: 'Balance',
    width: '20%',
  },
  {
    id: 'value',
    label: 'Value',
    width: '20%',
  },
  {
    id: 'actions',
    label: '',
    width: '20%',
  },
]

const AssetsTable = ({ items }: AssetsTableProps): ReactElement => {
  const rows = (items || []).map((item) => ({
    asset: {
      rawValue: item.tokenInfo.name,
      content: (
        <div className={css.alignCenter}>
          <TokenIcon logoUri={item.tokenInfo.logoUri} tokenSymbol={item.tokenInfo.symbol} />

          <Typography fontSize="medium">{item.tokenInfo.name}</Typography>

          <TokenExplorerLink address={item.tokenInfo.address} />
        </div>
      ),
    },
    balance: {
      rawValue: Number(item.balance) / 10 ** item.tokenInfo.decimals,
      content: <TokenAmount value={item.balance} decimals={item.tokenInfo.decimals} />,
    },
    value: {
      rawValue: parseFloat(item.fiatBalance),
      content: <FiatValue value={item.fiatBalance} />,
    },
    actions: {
      rawValue: '',
      content: (
        <Button variant="contained" color="primary">
          Send
        </Button>
      ),
    },
  }))

  return (
    <div className={css.container}>
      <EnhancedTable rows={rows} headCells={headCells} />
    </div>
  )
}

export default AssetsTable
