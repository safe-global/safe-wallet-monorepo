import { useContext } from 'react'
import { SpendingLimitsTable } from './SpendingLimitsTable'
import { useHasFeature } from '@/hooks/useChains'
import { NewSpendingLimitFlow } from '@/components/tx-flow/flows'
import { UpgradeFeature } from '@/services/analytics'
import CheckWallet from '@/components/common/CheckWallet'
import SafeProLock from '@/components/common/SafeProLock'
import { TxModalContext } from '@/components/tx-flow'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useAppSelector } from '@/store'
import { usePlanGate } from '@/features/spaces'
import { selectSpendingLimits, selectSpendingLimitsLoading } from '../../store/spendingLimitsSlice'
import useIsSpendingLimitSupported from '../../hooks/useIsSpendingLimitSupported'
import { SpendingLimitsSettingsView } from '@views/features/spending-limits/components/SpendingLimitsSettings/SpendingLimitsSettingsView'

const SpendingLimitsSettings = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const isEnabled = useHasFeature(FEATURES.SPENDING_LIMIT)
  const isSupported = useIsSpendingLimitSupported()
  const { mustUpgradeToSafePro, isLoading: isPlanLoading, upgradeHref } = usePlanGate(FEATURES.SPENDING_LIMIT_GATING)

  // Read data from store (loaded on app start via SpendingLimitsLoader)
  const spendingLimits = useAppSelector(selectSpendingLimits)
  const spendingLimitsLoading = useAppSelector(selectSpendingLimitsLoading)

  return (
    <SpendingLimitsSettingsView
      isEnabled={!!isEnabled}
      isSupported={isSupported}
      mustUpgradeToSafePro={mustUpgradeToSafePro}
      isPlanLoading={isPlanLoading}
      showEmptyState={isSupported && !spendingLimits.length && !spendingLimitsLoading}
      table={
        spendingLimits.length > 0 && (
          <SpendingLimitsTable isLoading={spendingLimitsLoading} spendingLimits={spendingLimits} />
        )
      }
      onNewSpendingLimit={() => setTxFlow(<NewSpendingLimitFlow />)}
      renderCheckWallet={(children) => <CheckWallet>{children}</CheckWallet>}
      renderSafeProLock={(title) => (
        <SafeProLock title={title} href={upgradeHref} feature={UpgradeFeature.SPENDING_LIMITS} />
      )}
    />
  )
}

export default SpendingLimitsSettings
