import { TxModalContext } from '@/components/tx-flow'
import { MigrateSafeL2Flow } from '@/components/tx-flow/flows'
import { ActionCard } from '@/components/common/ActionCard'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCallback, useContext } from 'react'
import {
  canMigrateUnsupportedMastercopy,
  isMigrationToL2Possible,
  isValidMasterCopy,
} from '@safe-global/utils/services/contracts/safeContracts'
import { useBytecodeComparison } from '@/hooks/useBytecodeComparison'
import { ATTENTION_PANEL_EVENTS } from '@/services/analytics/events/attention-panel'

const CLI_LINK = 'https://github.com/5afe/safe-cli'

export const UnsupportedMastercopyWarning = () => {
  const { safe } = useSafeInfo()
  const bytecodeComparison = useBytecodeComparison()
  const { setTxFlow } = useContext(TxModalContext)
  const openUpgradeModal = useCallback(() => setTxFlow(<MigrateSafeL2Flow />), [setTxFlow])

  // Don't show warning while still loading bytecode comparison
  if (bytecodeComparison.isLoading) {
    return null
  }

  // Show warning for all unsupported mastercopies
  const showWarning = !isValidMasterCopy(safe.implementationVersionState)

  if (!showWarning) return null

  // Check if migration is possible based on bytecode comparison
  const canMigrate =
    canMigrateUnsupportedMastercopy(safe, bytecodeComparison.result) ||
    (!isValidMasterCopy(safe.implementationVersionState) && isMigrationToL2Possible(safe))

  return (
    <ActionCard
      severity="warning"
      title="This Safe is running an unsupported version "
      content={
        canMigrate
          ? 'and may miss security fixes and improvements. You should migrate it to a compatible version.'
          : 'and may miss security fixes and improvements. You must use our CLI tool to migrate.'
      }
      action={
        canMigrate
          ? { label: 'Migrate', onClick: openUpgradeModal }
          : {
              label: 'Get CLI',
              href: CLI_LINK,
              target: '_blank',
              rel: 'noopener noreferrer',
            }
      }
      trackingEvent={canMigrate ? ATTENTION_PANEL_EVENTS.MIGRATE_MASTERCOPY : ATTENTION_PANEL_EVENTS.GET_CLI_MASTERCOPY}
      actionTestId={canMigrate ? 'migrate-mastercopy-btn' : 'get-cli-link'}
    />
  )
}
