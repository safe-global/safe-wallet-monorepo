import { LabelValue } from '@safe-global/store/gateway/types'
import type { LabelQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'
import css from './styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'

const GroupLabel = ({ item }: { item: LabelQueuedItem }): ReactElement => {
  const { safe } = useSafeInfo()

  const label =
    item.label === LabelValue.Queued
      ? `${item.label} - transaction with nonce ${safe.nonce} needs to be executed first`
      : item.label

  return <div className={css.container}>{label}</div>
}

export default GroupLabel
