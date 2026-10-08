import classNames from 'classnames'
import css from '@/components/tx-flow/flows/SuccessScreen/styles.module.css'
import { Typography } from '@/components/ui/typography'

const TRANSACTION_FAILED = 'Transaction failed'
const NESTED_SAFE_SUCCESSFUL = 'Nested Safe was created'
const TRANSACTION_SUCCESSFUL = 'Transaction was successful'

export type DefaultStatusViewProps = {
  error: undefined | Error
  isTimeout: boolean
  willDeploySafe: boolean
}

export const DefaultStatusView = ({ error, isTimeout, willDeploySafe: isCreatingSafe }: DefaultStatusViewProps) => (
  <div className="mt-6 px-6">
    <Typography data-testid="transaction-status" variant="h4" className="mt-4">
      {error ? TRANSACTION_FAILED : !isCreatingSafe ? TRANSACTION_SUCCESSFUL : NESTED_SAFE_SUCCESSFUL}
    </Typography>
    {error && (
      <div className={classNames(css.instructions, error ? css.errorBg : css.infoBg)}>
        <Typography variant="paragraph-small">
          {error ? (isTimeout ? 'Transaction timed out' : error.message) : ''}
        </Typography>
      </div>
    )}
  </div>
)
