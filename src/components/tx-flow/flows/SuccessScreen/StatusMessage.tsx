import classNames from 'classnames'
import { Box, Typography } from '@mui/material'
import LoadingSpinner, { SpinnerStatus } from '@/components/new-safe/create/steps/StatusStep/LoadingSpinner'
import { PendingStatus } from '@/store/pendingTxsSlice'
import css from './styles.module.css'

const getStep = (status: PendingStatus) => {
  switch (status) {
    case PendingStatus.PROCESSING:
      return {
        description: 'Transaction is now processing.',
        instruction: 'The transaction was confirmed and is now being processed.',
      }
    case PendingStatus.INDEXING:
      return {
        description: 'Transaction was processed.',
        instruction: 'It is now being indexed.',
      }
    default:
      return {
        description: 'Transaction was successful.',
        instruction: '',
      }
  }
}

const StatusMessage = ({ status, isError }: { status: PendingStatus; isError: boolean }) => {
  const stepInfo = getStep(status)

  const isSuccess = status === undefined
  const spinnerStatus = isSuccess ? SpinnerStatus.SUCCESS : SpinnerStatus.PROCESSING

  return (
    <>
      <Box paddingX={3} mt={3}>
        <LoadingSpinner status={spinnerStatus} />
        <Typography variant="h6" marginTop={2} fontWeight={700}>
          {stepInfo.description}
        </Typography>
      </Box>
      {stepInfo.instruction && (
        <Box className={classNames(css.instructions, isError ? css.errorBg : css.infoBg)}>
          <Typography variant="body2">{stepInfo.instruction}</Typography>
        </Box>
      )}
    </>
  )
}

export default StatusMessage
