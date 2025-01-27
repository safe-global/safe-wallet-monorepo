import { Button, SvgIcon } from '@mui/material'
import CopyTooltip from '@/components/common/CopyTooltip'
import CheckIcon from '@/public/images/common/check.svg'
import CloseIcon from '@/public/images/common/close.svg'
import CopyIcon from '@/public/images/common/copy.svg'
import type { ReactElement } from 'react'
import css from './styles.module.css'

const StatusAction = ({ status, link }: { status: string; link?: string }): ReactElement => {
  if (status === 'success') {
    return (
      <div>
        <SvgIcon
          component={CheckIcon}
          inheritViewBox
          fontSize="small"
          color="success"
          className={css.safenetCheckIcon}
        />
        <span className={css.labelSuccess}>No issues found</span>
      </div>
    )
  } else if (status === 'pending' && link) {
    return (
      <CopyTooltip text={link}>
        <Button
          variant="outlined"
          size="small"
          sx={{ width: '100%', py: 0.5 }}
          startIcon={<SvgIcon component={CopyIcon} inheritViewBox fontSize="small" />}
        >
          Share verification link
        </Button>
      </CopyTooltip>
    )
  } else {
    return (
      <div>
        <SvgIcon component={CloseIcon} inheritViewBox fontSize="small" color="error" className={css.safenetCheckIcon} />
        <span className={css.labelFailure}>Failure</span>
      </div>
    )
  }
}

export default StatusAction
