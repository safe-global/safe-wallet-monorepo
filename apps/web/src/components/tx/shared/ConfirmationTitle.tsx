import { Typography } from '@/components/ui/typography'
import EditIcon from '@/public/images/common/edit.svg'
import css from './styles.module.css'

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
        <Typography variant="h4" className="capitalize">
          {variant}
        </Typography>
        <Typography variant="paragraph-small">
          You&apos;re about to {isCreation ? 'create and ' : ''}
          {variant} this transaction.
        </Typography>
      </div>
    </div>
  )
}

export default ConfirmationTitle
