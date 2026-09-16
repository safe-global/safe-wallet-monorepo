import classNames from 'classnames'
import css from '@/components/tx-flow/flows/SuccessScreen/styles.module.css'
import { Typography } from '@/components/ui/typography'

export const IndexingStatus = ({ willDeploySafe: isCreatingSafe }: { willDeploySafe: boolean }) => (
  <div className="mt-6 px-6">
    <Typography data-testid="transaction-status" variant="h4" className="mt-4">
      {!isCreatingSafe ? 'Transaction' : 'Nested Safe'} was processed
    </Typography>
    <div className={classNames(css.instructions, css.infoBg)}>
      <Typography variant="paragraph-small"> It is now being indexed.</Typography>
    </div>
  </div>
)
