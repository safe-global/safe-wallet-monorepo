import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import WarningIcon from '@/public/images/notifications/warning.svg'

const WarningMessage = ({ message }: { message: string }): ReactElement => {
  return (
    <Typography variant="paragraph-small" align="center" className="text-warning-strong mb-2">
      <WarningIcon className="text-warning-accent mb-[-2px] inline size-4 align-middle" /> {message}
    </Typography>
  )
}

export default WarningMessage
