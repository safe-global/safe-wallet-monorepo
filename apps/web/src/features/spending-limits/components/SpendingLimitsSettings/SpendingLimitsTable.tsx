import EnhancedTable from '@/components/common/EnhancedTable'
import DeleteIcon from '@/public/images/common/delete.svg'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { relativeTime } from '@safe-global/utils/utils/date'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useContext, useMemo } from 'react'
import type { SpendingLimitState } from '../../types'
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
          <div className="flex flex-row items-center gap-2">
            <Skeleton className="size-[26px] rounded-full" />
            <div>
              <Typography>
                <Skeleton className="h-4 w-[75px]" />
              </Typography>
              <Typography>
                <Skeleton className="h-4 w-[300px]" />
              </Typography>
            </div>
          </div>
        ),
      },
      spent: {
        rawValue: '0',
        content: (
          <div className="flex flex-row items-center gap-2">
            <Skeleton className="size-[26px] rounded-full" />
            <Typography>
              <Skeleton className="h-4 w-[100px]" />
            </Typography>
          </div>
        ),
      },
      resetTime: {
        rawValue: '0',
        content: (
          <Typography>
            <Skeleton className="h-4 w-full" />
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
                    <div data-testid="spent-amount" className="flex items-center gap-2">
                      <TokenIcon logoUri={spendingLimit.token.logoUri} tokenSymbol={spendingLimit.token.symbol} />
                      {`${formattedSpent} of ${formattedAmount} ${spendingLimit.token.symbol}`}
                    </div>
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
                          <Button
                            data-testid="delete-btn"
                            onClick={() => setTxFlow(<RemoveSpendingLimitFlow spendingLimit={spendingLimit} />)}
                            variant="ghost"
                            size="icon-sm"
                            disabled={!isOk}
                          >
                            <DeleteIcon className="size-4 text-destructive" />
                          </Button>
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
