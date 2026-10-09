import { Typography } from '@safe-global/design/components/ui/typography'
import EditIcon from '@safe-global/design/assets/images/common/edit.svg'
import css from './styles.module.css'
import TxSectionTitle from '@safe-global/design/components/tx-flow/common/TxSectionTitle'

export enum ConfirmationTitleTypes {
  sign = 'confirm',
  execute = 'execute',
}

const ConfirmationTitle = ({ isCreation, variant }: { isCreation?: boolean; variant: ConfirmationTitleTypes }) => {
  return (
    <div className={css.wrapper}>
      <div className={`${css.icon} ${variant === ConfirmationTitleTypes.sign ? css.sign : css.execute}`}>
        <EditIcon className="size-4" />
      </div>
      <div>
        <TxSectionTitle className="capitalize">{variant}</TxSectionTitle>
        <Typography variant="paragraph-small">
          You&apos;re about to {isCreation ? 'create and ' : ''}
          {variant} this transaction.
        </Typography>
      </div>
    </div>
  )
}

export default ConfirmationTitle
