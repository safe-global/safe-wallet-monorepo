import type { ReactElement, ReactNode } from 'react'
import css from './styles.module.css'

export type TxListViewProps = {
  children: ReactNode
}

export const TxListView = ({ children }: TxListViewProps): ReactElement => {
  return <div className={css.container}>{children}</div>
}
