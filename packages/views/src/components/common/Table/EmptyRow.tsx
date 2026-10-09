import type { ReactElement } from 'react'
import css from './styles.module.css'

export const EmptyRow = (): ReactElement | null => {
  return <div className={css.gridEmptyRow}></div>
}
