import { useContext } from 'react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import AddIcon from '@/public/images/common/add.svg'
import { NoSpendingLimits } from './NoSpendingLimits'
import { SpendingLimitsTable } from './SpendingLimitsTable'
import { useHasFeature } from '@/hooks/useChains'
import { NewSpendingLimitFlow } from '@/components/tx-flow/flows'
import { SETTINGS_EVENTS } from '@/services/analytics'
import CheckWallet from '@/components/common/CheckWallet'
import SafeProLock from '@/components/common/SafeProLock'
import Track from '@/components/common/Track'
import { TxModalContext } from '@/components/tx-flow'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useAppSelector } from '@/store'
import { usePlanGate } from '@/features/spaces'
import { selectSpendingLimits, selectSpendingLimitsLoading } from '../../store/spendingLimitsSlice'
import useIsSpendingLimitSupported from '../../hooks/useIsSpendingLimitSupported'

const SpendingLimitsSettings = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const isEnabled = useHasFeature(FEATURES.SPENDING_LIMIT)
  const isSupported = useIsSpendingLimitSupported()
  const { mustUpgradeToSafePro, isLoading: isPlanLoading, upgradeHref } = usePlanGate(FEATURES.SPENDING_LIMIT_GATING)

  // Read data from store (loaded on app start via SpendingLimitsLoader)
  const spendingLimits = useAppSelector(selectSpendingLimits)
  const spendingLimitsLoading = useAppSelector(selectSpendingLimitsLoading)

  const renderNewSpendingLimitButton = (
    <CheckWallet>
      {(isOk) => (
        <Track {...SETTINGS_EVENTS.SPENDING_LIMIT.NEW_LIMIT}>
          <Button
            data-testid="new-spending-limit"
            onClick={() => setTxFlow(<NewSpendingLimitFlow />)}
            className="my-4"
            disabled={!isOk}
          >
            <AddIcon className="size-4" />
            New spending limit
          </Button>
        </Track>
      )}
    </CheckWallet>
  )

  return (
    <div data-testid="spending-limit-section" className="bg-card text-card-foreground rounded-lg p-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row">
        <div className="lg:w-1/5 lg:shrink-0">
          <Typography variant="h4" className="font-bold">
            Spending limits
          </Typography>
        </div>

        <div className="lg:min-w-0 lg:flex-1">
          {isEnabled ? (
            <div>
              <Typography>
                You can set rules for specific beneficiaries to access funds from this Safe account without having to
                collect all signatures.
              </Typography>

              {isSupported ? (
                mustUpgradeToSafePro ? (
                  <div className="my-4">
                    <SafeProLock title="Adding spending limits requires Safe Pro" href={upgradeHref} />
                  </div>
                ) : (
                  !isPlanLoading && renderNewSpendingLimitButton
                )
              ) : (
                <Typography className="mt-4 block">
                  The spending limit module isn&apos;t deployed on this chain yet, so new spending limits can&apos;t be
                  created here.
                </Typography>
              )}

              {isSupported && !spendingLimits.length && !spendingLimitsLoading && <NoSpendingLimits />}
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
