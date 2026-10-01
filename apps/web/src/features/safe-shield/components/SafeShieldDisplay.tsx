import { useMemo, type ReactElement } from 'react'
import { cn } from '@/utils/cn'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import SafeShieldLogoFullDark from '@/public/images/safe-shield/safe-shield-logo-dark.svg'
import { useDarkMode } from '@/hooks/useDarkMode'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
  DeadlockAnalysisResults,
  SafeAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldHeader } from './SafeShieldHeader'
import { SafeShieldContent } from './SafeShieldContent'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'
import { getOverallStatus } from '@safe-global/utils/features/safe-shield/utils'
import { useCheckSimulation } from '../hooks/useCheckSimulation'
import type { HypernativeAuthStatus } from '@/features/hypernative'
import { useCurrentChain } from '@/hooks/useChains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { countChecks } from '../utils/countChecks'
import { isContractCall } from '@/features/safe-shield/utils/isContractCall'
import {
  SafenetChecksPrototypeFeature,
  useIsSafenetPrototypeEnabled,
  withSafenetCheck,
} from '@/features/safenet-checks'
import { useLoadFeature } from '@/features/__core__'
import type { SafenetCheckPhase } from '@/features/safenet-checks/types'

const shieldLogoOnHover = [
  'cursor-pointer',
  '[&_.shield-img]:transition-[fill] [&_.shield-lines]:transition-[fill] [&_.shield-text]:transition-[fill]',
  'hover:[&_.shield-bg]:fill-[var(--color-background-secondary)]',
  'hover:[&_.shield-img]:fill-[var(--color-static-text-brand)]',
  'hover:[&_.shield-lines]:fill-[var(--color-static-main)]',
  'hover:[&_.shield-text]:fill-[var(--color-text-primary)]',
].join(' ')

export const SafeShieldDisplay = ({
  recipient,
  contract,
  threat,
  deadlock,
  safeTx,
  hypernativeAuth,
  showHypernativeInfo = true,
  showHypernativeActiveStatus = true,
  safeAnalysis,
  onAddToTrustedList,
  hasProFeatures = true,
  isSafePro = true,
  safenetPhase,
}: {
  recipient: AsyncResult<RecipientAnalysisResults>
  contract: AsyncResult<ContractAnalysisResults>
  threat: AsyncResult<ThreatAnalysisResults>
  deadlock: AsyncResult<DeadlockAnalysisResults>
  safeTx?: SafeTransaction
  hypernativeAuth?: HypernativeAuthStatus
  showHypernativeInfo?: boolean
  showHypernativeActiveStatus?: boolean
  safeAnalysis?: SafeAnalysisResult | null
  onAddToTrustedList?: () => void
  hasProFeatures?: boolean
  /** While SAFE_PRO is off the widget keeps its pre-Pro layout: no PRO block, simulation run by hand. */
  isSafePro?: boolean
  /** Set while the Safenet checks prototype shows a check; folds it into the header. */
  safenetPhase?: SafenetCheckPhase
}): ReactElement => {
  const [recipientResults] = recipient || []
  const [contractResults] = contract || []
  const [threatResults] = threat || []
  const [deadlockResults] = deadlock || []
  const { hasSimulationError, isSimulationSuccess } = useCheckSimulation(safeTx)
  const isDarkMode = useDarkMode()
  const chain = useCurrentChain()
  const hasSimulation = Boolean(chain && hasFeature(chain, FEATURES.TX_SIMULATION))

  const hnLoginRequired = useMemo(
    () => hypernativeAuth !== undefined && (!hypernativeAuth.isAuthenticated || hypernativeAuth.isTokenExpired),
    [hypernativeAuth],
  )

  const baseOverallStatus = useMemo(
    () =>
      getOverallStatus(
        recipientResults,
        contractResults,
        threatResults,
        hasSimulationError,
        hnLoginRequired,
        deadlockResults,
      ),
    [recipientResults, contractResults, threatResults, hasSimulationError, hnLoginRequired, deadlockResults],
  )

  const baseChecks = useMemo(
    () =>
      countChecks({
        threat: threatResults,
        recipient: recipientResults,
        contract: contractResults,
        deadlock: deadlockResults,
        hasProFeatures,
        hasSimulation,
        isSimulationSuccess,
        isContractCall: isContractCall(safeTx),
      }),
    [
      threatResults,
      recipientResults,
      contractResults,
      deadlockResults,
      hasProFeatures,
      hasSimulation,
      isSimulationSuccess,
      safeTx,
    ],
  )

  const safenetPrototype = useLoadFeature(SafenetChecksPrototypeFeature)
  const isSafenetPrototype = useIsSafenetPrototypeEnabled()
  const { overallStatus, checks, isPending } = useMemo(
    () => withSafenetCheck(safenetPhase, baseOverallStatus, baseChecks),
    [safenetPhase, baseOverallStatus, baseChecks],
  )

  const SafeShieldLogo = isDarkMode ? SafeShieldLogoFullDark : SafeShieldLogoFull

  return (
    <div className="flex flex-col gap-2" data-testid="safe-shield-widget">
      {/* Radius pairs with the inner header/list: 16px outer − 4px inset (px-1) = 12px inner, so the
          two curves stay concentric instead of the inner corner cutting inside the outer one. */}
      <div className={cn('overflow-hidden rounded-lg', isSafenetPrototype ? 'bg-muted' : 'bg-card')}>
        <SafeShieldHeader
          recipient={recipient}
          contract={contract}
          threat={threat}
          deadlock={deadlock}
          overallStatus={overallStatus}
          checks={checks}
          isPending={isPending}
          trailing={isPending ? <safenetPrototype.SafenetHeaderEta /> : undefined}
        />

        <SafeShieldContent
          threat={threat}
          recipient={recipient}
          contract={contract}
          deadlock={deadlock}
          safeTx={safeTx}
          overallStatus={overallStatus}
          hypernativeAuth={hypernativeAuth}
          showHypernativeInfo={showHypernativeInfo}
          showHypernativeActiveStatus={showHypernativeActiveStatus}
          safeAnalysis={safeAnalysis}
          onAddToTrustedList={onAddToTrustedList}
          hasProFeatures={hasProFeatures}
          isSafePro={isSafePro}
        />
      </div>

      <div className="flex flex-row items-center self-end">
        <ExternalLink href={HelpCenterArticle.SAFE_SHIELD} noIcon>
          {isSafenetPrototype ? (
            <safenetPrototype.SafenetShieldPill phase={safenetPhase} />
          ) : (
            <SafeShieldLogo data-testid="safe-shield-logo" width={78} height={18} className={shieldLogoOnHover} />
          )}
        </ExternalLink>
      </div>
    </div>
  )
}
