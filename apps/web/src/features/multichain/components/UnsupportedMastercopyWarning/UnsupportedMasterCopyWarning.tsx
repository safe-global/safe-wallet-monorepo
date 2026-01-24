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

  if (!showWarning) return

  // Check if migration is possible based on bytecode comparison
  const canMigrate =
    canMigrateUnsupportedMastercopy(safe, bytecodeComparison.result) ||
    (!isValidMasterCopy(safe.implementationVersionState) && isMigrationToL2Possible(safe))

  // Determine the message based on whether bytecode matched and migration is possible
  const isBytecodeMatch = bytecodeComparison.result?.isMatch
  const message = canMigrate
    ? isBytecodeMatch
      ? `Your Safe Account's base contract is not in the list of officially supported deployments, but its bytecode matches a supported L2 contract (${bytecodeComparison.result?.matchedVersion}). You can migrate it to the corresponding official deployment.`
      : "Your Safe Account's base contract is not supported. You should migrate it to a compatible version."
    : 'This Safe Account was created with an unsupported base contract. The web interface might not work correctly. We recommend using the command line interface instead.'

  return (
    <ActionCard
      severity="warning"
      title="Base contract is not supported"
      content={message}
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
    />
  )
}
