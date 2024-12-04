import { type ReactElement, type ReactNode } from 'react'
import Typography from '@mui/material/Typography'
import SvgIcon from '@mui/material/SvgIcon'
import classNames from 'classnames'
import CheckIcon from '@/public/images/common/check.svg'
import css from './styles.module.css'

const SuccessMessage = ({ children, className }: { children: ReactNode; className?: string }): ReactElement => {
  return (
    <div className={classNames(css.container, className)}>
      <div className={css.message}>
        <SvgIcon component={CheckIcon} color="success" inheritViewBox fontSize="small" />

        <Typography
          variant="body2"
          sx={{
            width: '100%',
          }}
        >
          {children}
        </Typography>
      </div>
    </div>
  )
}

export default SuccessMessage
