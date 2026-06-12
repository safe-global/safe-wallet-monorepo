import { useContext } from 'react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { NoSpendingLimits } from './NoSpendingLimits'
import { SpendingLimitsTable } from './SpendingLimitsTable'
import { useHasFeature } from '@/hooks/useChains'
import { NewSpendingLimitFlow } from '@/components/tx-flow/flows'
import { SETTINGS_EVENTS } from '@/services/analytics'
import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { TxModalContext } from '@/components/tx-flow'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useAppSelector } from '@/store'
import { selectSpendingLimits, selectSpendingLimitsLoading } from '../../store/spendingLimitsSlice'

const SpendingLimitsSettings = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const isEnabled = useHasFeature(FEATURES.SPENDING_LIMIT)

  // Read data from store (loaded on app start via SpendingLimitsLoader)
  const spendingLimits = useAppSelector(selectSpendingLimits)
  const spendingLimitsLoading = useAppSelector(selectSpendingLimitsLoading)

  return (
    <div data-testid="spending-limit-section" className="bg-card text-card-foreground rounded-lg p-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row">
        <div className="lg:w-1/3">
          <Typography variant="h4" className="font-bold">
            Spending limits
          </Typography>
        </div>

        <div className="flex-1">
          {isEnabled ? (
            <div>
              <Typography>
                You can set rules for specific beneficiaries to access funds from this Safe Account without having to
                collect all signatures.
              </Typography>

              <CheckWallet>
                {(isOk) => (
                  <Track {...SETTINGS_EVENTS.SPENDING_LIMIT.NEW_LIMIT}>
                    <Button
                      data-testid="new-spending-limit"
                      onClick={() => setTxFlow(<NewSpendingLimitFlow />)}
                      className="my-4"
                      disabled={!isOk}
                      size="sm"
                    >
                      New spending limit
                    </Button>
                  </Track>
                )}
              </CheckWallet>

              {!spendingLimits.length && !spendingLimitsLoading && <NoSpendingLimits />}
              {spendingLimits.length > 0 && (
                <SpendingLimitsTable isLoading={spendingLimitsLoading} spendingLimits={spendingLimits} />
              )}
            </div>
          ) : (
            <Typography>The spending limit feature is not yet available on this chain.</Typography>
          )}
        </div>
      </div>
    </div>
  )
}

export default SpendingLimitsSettings
