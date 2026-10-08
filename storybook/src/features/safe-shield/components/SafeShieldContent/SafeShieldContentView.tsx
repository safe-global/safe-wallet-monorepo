import type { ReactElement, ReactNode } from 'react'
import { SafeShieldAnalysisEmpty } from '@views/features/safe-shield/components/SafeShieldContent/SafeShieldAnalysisEmpty'
import { LockedCheckRow } from '@views/features/safe-shield/components/LockedCheckRow'

export type SafeShieldContentViewProps = {
  hnInfoCard?: ReactNode
  loading?: ReactNode
  showEmpty: boolean
  /** The open checks, in order: untrusted Safe warning, analysis cards, simulation. */
  openChecks: ReactNode
  showProSection: boolean
  proChecksRow: ReactNode
  hasProFeatures: boolean
  isContractCall: boolean
  proRecipientCard: ReactNode
  proContractCard: ReactNode
  proDeadlockCard: ReactNode
  proSimulation?: ReactNode
  simulationLocked?: ReactNode
  hypernativeLoginLine?: ReactNode
}

export const SafeShieldContentView = ({
  hnInfoCard,
  loading,
  showEmpty,
  openChecks,
  showProSection,
  proChecksRow,
  hasProFeatures,
  isContractCall,
  proRecipientCard,
  proContractCard,
  proDeadlockCard,
  proSimulation,
  simulationLocked,
  hypernativeLoginLine,
}: SafeShieldContentViewProps): ReactElement => {
  return (
    <div className="px-1 pb-1">
      {/* overflow-hidden clips the last row to the corners; rounded-b-md = the parent's 16px minus the 4px inset. */}
      <div className="relative overflow-hidden rounded-b-md">
        {hnInfoCard}

        {loading}

        {showEmpty && <SafeShieldAnalysisEmpty />}

        <div data-testid="open-checks-list">{openChecks}</div>

        {showProSection && (
          <div className="mt-1 flex flex-col rounded-md bg-muted" data-testid="pro-checks-section">
            {proChecksRow}
            <div className="flex flex-col gap-1 px-1 pb-1 [&>*]:rounded-md [&>*]:bg-muted-secondary">
              {hasProFeatures ? (
                proRecipientCard
              ) : (
                <LockedCheckRow data-testid="recipient-analysis-locked">Known recipient</LockedCheckRow>
              )}

              {hasProFeatures && proContractCard}
              {!hasProFeatures && isContractCall && (
                <LockedCheckRow data-testid="contract-analysis-locked">Known contract</LockedCheckRow>
              )}

              {hasProFeatures && proDeadlockCard}

              {proSimulation}
              {simulationLocked}
            </div>
          </div>
        )}

        {hypernativeLoginLine}
      </div>
    </div>
  )
}
