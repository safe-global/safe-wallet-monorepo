import useIsSafenetEnabled from '@/hooks/useIsSafenetEnabled'
import type { LinearProgressProps } from '@mui/material'
import { LinearProgress } from '@mui/material'

import css from './styles.module.css'

export const ProgressBar = (props: LinearProgressProps) => {
  const isSafenetEnabled = useIsSafenetEnabled()

  return (
    <LinearProgress
      className={isSafenetEnabled ? css.safenetProgressBar : css.progressBar}
      variant="determinate"
      color="secondary"
      {...props}
    />
  )
}
