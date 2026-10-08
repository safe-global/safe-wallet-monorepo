import type { ReactElement } from 'react'
import css from './styles.module.css'

export type GroupLabelViewProps = {
  label: string
  isQueued: boolean
  nonce: number
}

export const GroupLabelView = ({ label, isQueued, nonce }: GroupLabelViewProps): ReactElement => {
  const text = isQueued ? `${label} - transaction with nonce ${nonce} needs to be executed first` : label

  return <div className={css.container}>{text}</div>
}
