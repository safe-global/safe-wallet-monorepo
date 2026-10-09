import { Typography } from '@/components/ui/typography'
import type { ReactElement, ReactNode } from 'react'
import css from './styles.module.css'

type InfoDetailsProps = {
  datatestid?: String
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
