import { useCallback, useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { MigrateSafeL2Flow, UpdateSafeFlow } from '@/components/tx-flow/flows'
import { ActionCard } from '@/components/common/ActionCard'
import CheckWallet from '@/components/common/CheckWallet'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { trackEvent } from '@/services/analytics'
import { ATTENTION_PANEL_EVENTS } from '@/services/analytics/events/attention-panel'
import { useMastercopyMigration } from '../../hooks/useMastercopyMigration'
import { MastercopyWarningView } from '@views/features/multichain/components/MastercopyWarning/MastercopyWarningView'

type MastercopyWarningProps = {
  /**
   * `dashboard` (default) renders the compact ActionCard shown in the attention panel.
   * `settings` renders the richer Alert shown on the Contract version settings page,
   * which also prompts non-critical updates.
   */
  variant?: 'dashboard' | 'settings'
}

export const MastercopyWarning = ({ variant = 'dashboard' }: MastercopyWarningProps) => {
  const { action, isCritical, isOfficialDeployer, isBytecodeLoading, latestVersion, changelogUrl } =
    useMastercopyMigration()
  const isOwner = useIsSafeOwner()
  const { setTxFlow } = useContext(TxModalContext)
  const openMigrateModal = useCallback(() => setTxFlow(<MigrateSafeL2Flow />), [setTxFlow])
  const openUpdateModal = useCallback(() => setTxFlow(<UpdateSafeFlow />), [setTxFlow])

  // Don't show a warning while the bytecode comparison is still resolving
  if (isBytecodeLoading) return null

  return (
    <MastercopyWarningView
      variant={variant}
      action={action}
      isCritical={isCritical}
      isOfficialDeployer={isOfficialDeployer}
      latestVersion={latestVersion}
      changelogUrl={changelogUrl}
      isOwner={isOwner}
      onMigrate={() => {
        trackEvent(ATTENTION_PANEL_EVENTS.MIGRATE_MASTERCOPY)
        openMigrateModal()
      }}
      onGetCli={() => trackEvent(ATTENTION_PANEL_EVENTS.GET_CLI_MASTERCOPY)}
      onUpdate={openUpdateModal}
      checkWallet={(render) => <CheckWallet>{render}</CheckWallet>}
      renderActionCard={(props) => <ActionCard {...props} />}
    />
  )
}
