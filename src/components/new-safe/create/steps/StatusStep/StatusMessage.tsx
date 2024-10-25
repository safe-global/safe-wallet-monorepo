import { Box, Typography } from '@mui/material'
import { SafeCreationStatus } from '@/components/new-safe/create/steps/StatusStep/useSafeCreation'
import LoadingSpinner, { SpinnerStatus } from '@/components/new-safe/create/steps/StatusStep/LoadingSpinner'

const getStep = (status: SafeCreationStatus) => {
  const ERROR_TEXT = 'Please cancel the process or retry the transaction.'

  switch (status) {
    case SafeCreationStatus.AWAITING:
      return {
        description: 'Waiting for transaction confirmation.',
        instruction: 'Please confirm the transaction with your connected wallet.',
      }
    case SafeCreationStatus.WALLET_REJECTED:
      return {
        description: 'Transaction was rejected.',
        instruction: ERROR_TEXT,
      }
    case SafeCreationStatus.PROCESSING:
      return {
        description: 'Transaction is being executed.',
        instruction: 'Please do not leave this page.',
      }
    case SafeCreationStatus.ERROR:
      return {
        description: 'There was an error.',
        instruction: ERROR_TEXT,
      }
    case SafeCreationStatus.REVERTED:
      return {
        description: 'Transaction was reverted.',
        instruction: ERROR_TEXT,
      }
    case SafeCreationStatus.TIMEOUT:
      return {
        description: 'Transaction was not found. Be aware that it might still be processed.',
        instruction: ERROR_TEXT,
      }
    case SafeCreationStatus.SUCCESS:
      return {
        description: 'Your Super Account is being indexed..',
        instruction: 'The account will be ready for use shortly. Please do not leave this page.',
      }
    case SafeCreationStatus.INDEXED:
      return {
        description: 'Your Super Account was successfully created!',
        instruction: '',
      }
    case SafeCreationStatus.INDEX_FAILED:
      return {
        description: 'Your Super Account is successfully created!',
        instruction:
          'You can already open Super Account. It might take a moment until it becomes fully usable in the interface.',
      }
  }
}

const StatusMessage = ({ status, isError }: { status: SafeCreationStatus; isError: boolean }) => {
  const stepInfo = getStep(status)

  const color = isError ? 'error' : 'info'
  const isSuccess = status >= SafeCreationStatus.SUCCESS
  const spinnerStatus = isError ? SpinnerStatus.ERROR : isSuccess ? SpinnerStatus.SUCCESS : SpinnerStatus.PROCESSING

  return (
    <>
      <Box data-testid="safe-status-info" paddingX={3} mt={3}>
        <LoadingSpinner status={spinnerStatus} />
        <Typography variant="h6" marginTop={2} fontWeight={700}>
          {stepInfo.description}
        </Typography>
      </Box>
      {stepInfo.instruction && (
        <Box
          sx={({ palette }) => ({
            backgroundColor: palette[color].background,
            borderColor: palette[color].light,
            borderWidth: 1,
            borderStyle: 'solid',
            borderRadius: '6px',
          })}
          padding={3}
          mt={4}
          mb={0}
        >
          <Typography variant="body2">{stepInfo.instruction}</Typography>
        </Box>
      )}
    </>
  )
}

export default StatusMessage
