import { useMemo, type ReactElement } from 'react'
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
import css from './SafeShieldBadge.module.css'
import { useIsSafenetCheckRunning, useIsSafenetChecksEnabled } from '@/features/safenet-checks'

const shieldLogoTransition =
  'cursor-pointer [&_.shield-bg]:transition-[fill] [&_.shield-img]:transition-[fill] [&_.shield-lines]:transition-[fill] [&_.shield-text]:transition-[fill] duration-500'

const shieldLogoOnHover = [
  shieldLogoTransition,
  'hover:[&_.shield-bg]:fill-[var(--color-background-secondary)]',
  'hover:[&_.shield-img]:fill-[var(--color-static-text-brand)]',
  'hover:[&_.shield-lines]:fill-[var(--color-static-main)]',
  'hover:[&_.shield-text]:fill-[var(--color-text-primary)]',
].join(' ')

/** The hover colors, held once every check has finished. */
const shieldLogoDone = [
  shieldLogoTransition,
  '[&_.shield-bg]:fill-[var(--color-background-secondary)]',
  '[&_.shield-img]:fill-[var(--color-static-text-brand)]',
  '[&_.shield-lines]:fill-[var(--color-static-main)]',
  '[&_.shield-text]:fill-[var(--color-text-primary)]',
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
  isOffchainMessage = false,
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
  isOffchainMessage?: boolean
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

  const overallStatus = useMemo(
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

  const checks = useMemo(
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
        isOffchainMessage,
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
      isOffchainMessage,
    ],
  )

  const SafeShieldLogo = isDarkMode ? SafeShieldLogoFullDark : SafeShieldLogoFull

  // Safenet only renders in the Pro section, so only a Pro widget waits for its verdict.
  const isSafenetShown = useIsSafenetChecksEnabled() && isSafePro && hasProFeatures && !isOffchainMessage
  const isSafenetRunning = useIsSafenetCheckRunning(isSafenetShown)

  const isAnalysing = [recipient, contract, threat, deadlock].some((result) => result?.[2])
  const hasResults = [recipientResults, contractResults, threatResults, deadlockResults].some(Boolean)
  const isDone = !isAnalysing && hasResults && !isSafenetRunning

  return (
    <div className="flex flex-col gap-2" data-testid="safe-shield-widget">
      {/* Radius pairs with the inner header/list: 16px outer − 4px inset (px-1) = 12px inner, so the
          two curves stay concentric instead of the inner corner cutting inside the outer one. */}
      <div className="overflow-hidden rounded-lg bg-card">
        <SafeShieldHeader
          recipient={recipient}
          contract={contract}
          threat={threat}
          deadlock={deadlock}
          overallStatus={overallStatus}
          checks={checks}
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
          isOffchainMessage={isOffchainMessage}
        />
      </div>

      <div className="flex flex-row items-center self-end">
        <ExternalLink href={HelpCenterArticle.SAFE_SHIELD} noIcon>
          {/* Remounts when the checks finish, so the shimmer plays once per result. */}
          <span key={isDone ? 'done' : 'running'} className={css.badge} data-done={isDone}>
            <SafeShieldLogo
              data-testid="safe-shield-logo"
              width={104}
              height={24}
              className={isDone ? shieldLogoDone : shieldLogoOnHover}
            />
          </span>
        </ExternalLink>
      </div>
    </div>
  )
}
