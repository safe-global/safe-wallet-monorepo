import { Box, Typography } from '@mui/material'
import classNames from 'classnames'
import css from '@/components/tx-flow/flows/SuccessScreen/styles.module.css'
import { isTimeoutError } from '@/utils/ethers-utils'

const TRANSACTION_FAILED = 'Transaction failed'
const NESTED_SAFE_SUCCESSFUL = 'Nested Safe was created'
const TRANSACTION_SUCCESSFUL = 'Transaction was successful'

type Props = {
  error: undefined | Error
  willDeploySafe: boolean
}
export const DefaultStatus = ({ error, willDeploySafe: isCreatingSafe }: Props) => (
  <Box px={3} mt={3}>
    <Typography data-testid="transaction-status" variant="h6" mt={2} fontWeight={700}>
      {error ? TRANSACTION_FAILED : !isCreatingSafe ? TRANSACTION_SUCCESSFUL : NESTED_SAFE_SUCCESSFUL}
    </Typography>
    {error && (
      <Box className={classNames(css.instructions, error ? css.errorBg : css.infoBg)}>
        <Typography variant="body2">
          {error ? (isTimeoutError(error) ? 'Transaction timed out' : error.message) : ''}
        </Typography>
      </Box>
    )}
  </Box>
)
