import { TxModalContext } from '@/components/tx-flow'
import { MigrateSafeL2Flow } from '@/components/tx-flow/flows'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Button, Typography } from '@mui/material'
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded'
import { useCallback, useContext } from 'react'
import {
  canMigrateUnsupportedMastercopy,
  isMigrationToL2Possible,
  isValidMasterCopy,
} from '@safe-global/utils/services/contracts/safeContracts'
import { useBytecodeComparison } from '@/hooks/useBytecodeComparison'

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
    <ErrorMessage level="warning" title="Base contract is not supported">
      <Typography>{message}</Typography>
      {canMigrate ? (
        <Button
          variant="text"
          size="small"
          endIcon={<KeyboardArrowRightRoundedIcon />}
          onClick={openUpgradeModal}
          sx={{
            mt: 1,
            ml: -1,
            p: 1,
            minWidth: 'auto',
            textTransform: 'none',
            textDecoration: 'none !important',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline !important',
              backgroundColor: 'transparent',
            },
          }}
        >
          Migrate
        </Button>
      ) : (
        <Button
          variant="text"
          size="small"
          endIcon={<KeyboardArrowRightRoundedIcon />}
          href={CLI_LINK}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            mt: 1,
            ml: -1,
            p: 1,
            minWidth: 'auto',
            textTransform: 'none',
            textDecoration: 'none !important',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline !important',
              backgroundColor: 'transparent',
            },
          }}
        >
          Get CLI
        </Button>
      )}
    </ErrorMessage>
  )
}
