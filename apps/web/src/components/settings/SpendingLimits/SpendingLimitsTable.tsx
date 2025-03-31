import EnhancedTable from '@/components/common/EnhancedTable'
import DeleteIcon from '@/public/images/common/delete.svg'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { Box, IconButton, Skeleton, SvgIcon, Typography } from '@mui/material'
import { relativeTime } from '@safe-global/utils/utils/date'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useContext, useMemo } from 'react'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import { RemoveSpendingLimitFlow } from '@/components/tx-flow/flows'
import { TxModalContext } from '@/components/tx-flow'
import Track from '@/components/common/Track'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import TokenIcon from '@/components/common/TokenIcon'
import SpendingLimitLabel from '@/components/common/SpendingLimitLabel'
import CheckWallet from '@/components/common/CheckWallet'

const SKELETON_ROWS = new Array(3).fill('').map(() => {
  return {
    cells: {
      beneficiary: {
        rawValue: '0x',
        content: (
          <Box display="flex" flexDirection="row" gap={1} alignItems="center">
            <Skeleton variant="circular" width={26} height={26} />
            <div>
              <Typography>
                <Skeleton width={75} />
              </Typography>
              <Typography>
                <Skeleton width={300} />
              </Typography>
            </div>
          </Box>
        ),
      },
      spent: {
        rawValue: '0',
        content: (
          <Box display="flex" flexDirection="row" gap={1} alignItems="center">
            <Skeleton variant="circular" width={26} height={26} />
            <Typography>
              <Skeleton width={100} />
            </Typography>
          </Box>
        ),
      },
      resetTime: {
        rawValue: '0',
        content: (
          <Typography>
            <Skeleton />
          </Typography>
        ),
      },
    },
  }
})

export const SpendingLimitsTable = ({
  spendingLimits,
  isLoading,
}: {
  spendingLimits: SpendingLimitState[]
  isLoading: boolean
}) => {
  const { setTxFlow } = useContext(TxModalContext)

  const headCells = useMemo(
    () => [
      { id: 'beneficiary', label: 'Beneficiary' },
      { id: 'spent', label: 'Spent' },
      { id: 'resetTime', label: 'Reset time' },
      { id: 'actions', label: 'Actions', sticky: true },
    ],
    [],
  )

  const rows = useMemo(
    () =>
      isLoading
        ? SKELETON_ROWS
        : spendingLimits.map((spendingLimit) => {
            const amount = BigInt(spendingLimit.amount)
            const formattedAmount = safeFormatUnits(amount, spendingLimit.token.decimals)

            const spent = BigInt(spendingLimit.spent)
            const formattedSpent = safeFormatUnits(spent, spendingLimit.token.decimals)

            return {
              cells: {
                beneficiary: {
                  rawValue: spendingLimit.beneficiary,
                  content: (
                    <EthHashInfo address={spendingLimit.beneficiary} shortAddress={false} hasExplorer showCopyButton />
                  ),
                },
                spent: {
                  rawValue: spendingLimit.spent,
                  content: (
                    <Box data-testid="spent-amount" display="flex" alignItems="center" gap={1}>
                      <TokenIcon logoUri={spendingLimit.token.logoUri} tokenSymbol={spendingLimit.token.symbol} />
                      {`${formattedSpent} of ${formattedAmount} ${spendingLimit.token.symbol}`}
                    </Box>
                  ),
                },
                resetTime: {
                  rawValue: spendingLimit.resetTimeMin,
                  content: (
                    <SpendingLimitLabel
                      data-testid="reset-time"
                      label={relativeTime(spendingLimit.lastResetMin, spendingLimit.resetTimeMin)}
                      isOneTime={spendingLimit.resetTimeMin === '0'}
                    />
                  ),
                },
                actions: {
                  rawValue: '',
                  sticky: true,
                  content: (
                    <CheckWallet>
                      {(isOk) => (
                        <Track {...SETTINGS_EVENTS.SPENDING_LIMIT.REMOVE_LIMIT}>
                          <IconButton
                            data-testid="delete-btn"
                            onClick={() => setTxFlow(<RemoveSpendingLimitFlow spendingLimit={spendingLimit} />)}
                            color="error"
                            size="small"
                            disabled={!isOk}
                          >
                            <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
                          </IconButton>
                        </Track>
                      )}
                    </CheckWallet>
                  ),
                },
              },
            }
          }),
    [isLoading, setTxFlow, spendingLimits],
  )
  return spendingLimits.length > 0 ? <EnhancedTable rows={rows} headCells={headCells} /> : null
}
