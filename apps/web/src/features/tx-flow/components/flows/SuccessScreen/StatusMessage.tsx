import { isTimeoutError } from '@/utils/ethers-utils'
import classNames from 'classnames'
import { Box, Typography } from '@mui/material'
import LoadingSpinner, { SpinnerStatus } from '@/components/new-safe/create/steps/StatusStep/LoadingSpinner'
import { PendingStatus } from '@/store/pendingTxsSlice'
import css from './styles.module.css'

const getStep = (status: PendingStatus, error?: Error) => {
  switch (status) {
    case PendingStatus.PROCESSING:
    case PendingStatus.RELAYING:
      return {
        description: 'Transaction is now processing',
        instruction: 'The transaction was confirmed and is now being processed.',
        classNames: '',
      }
    case PendingStatus.INDEXING:
      return {
        description: 'Transaction was processed',
        instruction: 'It is now being indexed.',
        classNames: classNames(css.instructions, error ? css.errorBg : css.infoBg),
      }
    default:
      return {
        description: error ? 'Transaction failed' : 'Transaction was successful',
        instruction: error ? (isTimeoutError(error) ? 'Transaction timed out' : error.message) : '',
        classNames: classNames(css.instructions, error ? css.errorBg : css.infoBg),
      }
  }
}

const StatusMessage = ({ status, error }: { status: PendingStatus; error?: Error }) => {
  const stepInfo = getStep(status, error)

  const isSuccess = status === undefined
  const spinnerStatus = error ? SpinnerStatus.ERROR : isSuccess ? SpinnerStatus.SUCCESS : SpinnerStatus.PROCESSING

  return (
    <>
      <Box px={3} mt={3}>
        <LoadingSpinner status={spinnerStatus} />
        <Typography data-testid="transaction-status" variant="h6" mt={2} fontWeight={700}>
          {stepInfo.description}
        </Typography>
      </Box>
      {stepInfo.instruction && (
        <Box className={stepInfo.classNames}>
          <Typography variant="body2">{stepInfo.instruction}</Typography>
        </Box>
      )}
    </>
  )
}

export default StatusMessage
