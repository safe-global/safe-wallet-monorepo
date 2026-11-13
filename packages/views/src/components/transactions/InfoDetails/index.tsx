import { Typography } from '@safe-global/views/components/ui/typography'
import type { ReactElement, ReactNode } from 'react'
import css from './styles.module.css'

type InfoDetailsProps = {
  datatestid?: string
  children?: ReactNode
  title: string | ReactElement
}

export const InfoDetails = ({ datatestid, children, title }: InfoDetailsProps): ReactElement => (
  <div data-testid={datatestid} className={css.container}>
    <Typography>
      <b>{title}</b>
    </Typography>
    {children}
  </div>
)
