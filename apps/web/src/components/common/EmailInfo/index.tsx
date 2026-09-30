import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import css from './styles.module.css'

export type EmailInfoProps = {
  email: string
  size?: 'xsmall' | 'small' | 'medium' | 'large'
  rounded?: boolean
  showTooltip?: boolean
}

const EmailInfo = ({
  email,
  size = 'medium',
  rounded = true,
  showTooltip = false,
}: EmailInfoProps): ReactElement | null => {
  if (!email || !email.trim()) return null

  const emailNode = <span className={css.email}>{email}</span>

  return (
    <div className={css.container}>
      <InitialsAvatar name={email} size={size} rounded={rounded} />
      {showTooltip ? (
        <Tooltip>
          <TooltipTrigger render={emailNode} />
          <TooltipContent side="top">{email}</TooltipContent>
        </Tooltip>
      ) : (
        emailNode
      )}
    </div>
  )
}

export default EmailInfo
