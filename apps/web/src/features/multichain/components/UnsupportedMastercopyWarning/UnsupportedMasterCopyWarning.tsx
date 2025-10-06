import { TxModalContext } from '@/components/tx-flow'
import { MigrateSafeL2Flow } from '@/components/tx-flow/flows'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Button, Stack, Typography } from '@mui/material'
import { useCallback, useContext } from 'react'
import {
  canMigrateUnsupportedMastercopy,
  isMigrationToL2Possible,
  isValidMasterCopy,
} from '@safe-global/utils/services/contracts/safeContracts'
import { useBytecodeComparison } from '@/hooks/useBytecodeComparison'

export const UnsupportedMastercopyWarning = () => {
  const { safe } = useSafeInfo()
  const bytecodeComparison = useBytecodeComparison()
  const { setTxFlow } = useContext(TxModalContext)
  const openUpgradeModal = useCallback(() => setTxFlow(<MigrateSafeL2Flow />), [setTxFlow])

  // Don't show warning while still loading bytecode comparison
  if (bytecodeComparison.isLoading) {
    return null
  }

  // Check if migration is possible based on bytecode comparison
  const canMigrate =
    canMigrateUnsupportedMastercopy(safe, bytecodeComparison.result) ||
    (!isValidMasterCopy(safe.implementationVersionState) && isMigrationToL2Possible(safe))

  const showWarning = !isValidMasterCopy(safe.implementationVersionState) && canMigrate

  if (!showWarning) return

  // Determine the message based on whether bytecode matched
  const isBytecodeMatch = bytecodeComparison.result?.isMatch
  const message = isBytecodeMatch
    ? `Your Safe Account's base contract is not in the list of officially supported deployments, but its bytecode matches a supported L2 contract (${bytecodeComparison.result?.matchedVersion}). You can migrate it to the corresponding official deployment.`
    : "Your Safe Account's base contract is not supported. You should migrate it to a compatible version."

  return (
    <ErrorMessage level="warning" title="Base contract is not supported">
      <Stack spacing={2}>
        <Typography display="inline" mr={1}>
          {message}
        </Typography>
        <div>
          <Button variant="contained" style={{ textDecoration: 'none' }} onClick={openUpgradeModal}>
            Migrate
          </Button>
        </div>
      </Stack>
    </ErrorMessage>
  )
}
