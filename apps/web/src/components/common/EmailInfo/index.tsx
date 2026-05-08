import type { ReactElement } from 'react'
import { Box, Tooltip } from '@mui/material'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import css from './styles.module.css'

export type EmailInfoProps = {
  email: string
  size?: 'xsmall' | 'small' | 'medium' | 'large'
  rounded?: boolean
  showTooltip?: boolean
}

const EmailInfo = ({ email, size = 'medium', rounded = true, showTooltip = true }: EmailInfoProps): ReactElement => {
  const emailNode = (
    <Box component="span" className={css.email}>
      {email}
    </Box>
  )

  return (
    <div className={css.container}>
      <InitialsAvatar name={email} size={size} rounded={rounded} />
      {showTooltip ? (
        <Tooltip title={email} placement="top" enterDelay={500}>
          {emailNode}
        </Tooltip>
      ) : (
        emailNode
      )}
    </div>
  )
}

export default EmailInfo
