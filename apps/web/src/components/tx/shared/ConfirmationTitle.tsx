import { SvgIcon, Typography } from '@mui/material'
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
        <SvgIcon component={EditIcon} inheritViewBox fontSize="small" />
      </div>
      <div>
        <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>
          {variant}
        </Typography>
        <Typography variant="body2">
          You&apos;re about to {isCreation ? 'create and ' : ''}
          {variant} this transaction.
        </Typography>
      </div>
    </div>
  )
}

export default ConfirmationTitle
