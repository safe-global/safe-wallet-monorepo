import classNames from 'classnames'
import css from '@/components/tx-flow/flows/SuccessScreen/styles.module.css'
import { isTimeoutError } from '@/utils/ethers-utils'
import { Typography } from '@/components/ui/typography'

const TRANSACTION_FAILED = 'Transaction failed'
const NESTED_SAFE_SUCCESSFUL = 'Nested Safe was created'
const TRANSACTION_SUCCESSFUL = 'Transaction was successful'

type Props = {
  error: undefined | Error
  willDeploySafe: boolean
}
export const DefaultStatus = ({ error, willDeploySafe: isCreatingSafe }: Props) => (
  <div className="mt-6 px-6">
    <Typography data-testid="transaction-status" variant="h4" className="mt-4">
      {error ? TRANSACTION_FAILED : !isCreatingSafe ? TRANSACTION_SUCCESSFUL : NESTED_SAFE_SUCCESSFUL}
    </Typography>
    {error && (
      <div className={classNames(css.instructions, error ? css.errorBg : css.infoBg)}>
        <Typography variant="paragraph-small">
          {error ? (isTimeoutError(error) ? 'Transaction timed out' : error.message) : ''}
        </Typography>
      </div>
    )}
  </div>
)
