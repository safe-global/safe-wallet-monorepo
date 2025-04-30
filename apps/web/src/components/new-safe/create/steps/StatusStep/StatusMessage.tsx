import ExternalLink from '@/components/common/ExternalLink'
import LoadingSpinner, { SpinnerStatus } from '@/components/new-safe/create/steps/StatusStep/LoadingSpinner'
import { SafeCreationEvent } from '@/features/counterfactual/services/safeCreationEvents'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { Box, Typography } from '@mui/material'
import FailedIcon from '@/public/images/common/tx-failed.svg'
import type { UndeployedSafe } from '@safe-global/utils/features/counterfactual/store/types'

const getStep = (status: SafeCreationEvent) => {
  switch (status) {
    case SafeCreationEvent.AWAITING_EXECUTION:
      return {
        description: 'Your account is awaiting activation',
        instruction: 'Activate the account to unlock all features of your smart wallet',
      }
    case SafeCreationEvent.PROCESSING:
    case SafeCreationEvent.RELAYING:
      return {
        description: 'We are activating your account',
        instruction: 'It can take some minutes to create your account, but you can check the progress below.',
      }
    case SafeCreationEvent.FAILED:
      return {
        description: "Your account couldn't be created",
        instruction:
          'The creation transaction was rejected by the connected wallet. You can retry or create an account from scratch.',
      }
    case SafeCreationEvent.REVERTED:
      return {
        description: "Your account couldn't be created",
        instruction: 'The creation transaction reverted. You can retry or create an account from scratch.',
      }
    case SafeCreationEvent.SUCCESS:
      return {
        description: 'Your Safe Account is being indexed..',
        instruction: 'The account will be ready for use shortly. Please do not leave this page.',
      }
    case SafeCreationEvent.INDEXED:
      return {
        description: 'Your Safe Account was successfully created!',
        instruction: '',
      }
  }
}

const StatusMessage = ({
  status,
  isError,
  pendingSafe,
}: {
  status: SafeCreationEvent
  isError: boolean
  pendingSafe: UndeployedSafe | undefined
}) => {
  const stepInfo = getStep(status)
  const chain = useCurrentChain()

  const isSuccess = status === SafeCreationEvent.SUCCESS
  const spinnerStatus = isSuccess ? SpinnerStatus.SUCCESS : SpinnerStatus.PROCESSING
  const explorerLink =
    chain && pendingSafe?.status.txHash ? getBlockExplorerLink(chain, pendingSafe.status.txHash) : undefined

  return (
    <>
      <Box data-testid="safe-status-info" px={3} mt={3}>
        <Box width="160px" height="160px" display="flex" m="auto">
          {isError ? <FailedIcon /> : <LoadingSpinner status={spinnerStatus} />}
        </Box>
        <Typography variant="h3" mt={2} fontWeight={700}>
          {stepInfo.description}
        </Typography>
      </Box>
      <Box sx={{ maxWidth: 390, m: 'auto' }}>
        {stepInfo.instruction && (
          <Typography variant="body2" my={2}>
            {stepInfo.instruction}
          </Typography>
        )}
        {!isError && explorerLink && (
          <ExternalLink href={explorerLink.href}>Check status on block explorer</ExternalLink>
        )}
      </Box>
    </>
  )
}

export default StatusMessage
