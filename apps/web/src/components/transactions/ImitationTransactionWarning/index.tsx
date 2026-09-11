import type { ReactElement } from 'react'
import { Alert } from '@/components/ui/alert'

import InfoOutlinedIcon from '@/public/images/notifications/info.svg'
import css from './styles.module.css'

export const ImitationTransactionWarning = (): ReactElement => {
  return (
    <Alert
      className={css.alert}
      style={{
        borderLeft: '3px solid var(--color-error-main)',
        backgroundColor: 'var(--color-error-background)',
        color: 'var(--color-error-dark)',
      }}
    >
      <InfoOutlinedIcon className="size-4 text-[var(--color-error-main)]" />
      <span>
        <b>This may be a malicious transaction.</b> Check and confirm the address before interacting with it.{' '}
      </span>
    </Alert>
  )
}
