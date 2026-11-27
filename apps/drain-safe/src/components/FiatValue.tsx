import { Stack, Tooltip } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import type { TokenBalance } from '@safe-global/safe-apps-sdk'
import { useTransferCost } from '../hooks/useTransferCost'
import { formatFiat } from '../utils/format'

export const CURRENCY = 'USD'

type Props = {
  item: TokenBalance
  gasPrice: bigint
  nativeFiatPrice: number
}

function FiatValue({ item, gasPrice, nativeFiatPrice }: Props) {
  const transferCost = useTransferCost(item, gasPrice, nativeFiatPrice)
  const costsMoreThanValue = transferCost > 0 && transferCost >= Number(item.fiatBalance)

  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      {formatFiat(item.fiatBalance, CURRENCY)}
      {costsMoreThanValue && (
        <Tooltip
          placement="top"
          title={`Beware that the cost of this token transfer could be higher than its current market value (Estimated transfer cost: ${formatFiat(transferCost, CURRENCY)})`}
        >
          <WarningAmberIcon color="warning" fontSize="small" />
        </Tooltip>
      )}
    </Stack>
  )
}

export default FiatValue
