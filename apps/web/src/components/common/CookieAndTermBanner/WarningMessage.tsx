import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import WarningIcon from '@/public/images/notifications/warning.svg'

const WarningMessage = ({ message }: { message: string }): ReactElement => {
  return (
    <Typography variant="paragraph-small" align="center" className="mb-2 text-[var(--color-warning-background)]">
      <WarningIcon className="mb-[-2px] inline size-4 align-middle text-[var(--color-error-main)]" /> {message}
    </Typography>
  )
}

export default WarningMessage
