import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTransactionType } from '@/hooks/useTransactionType'
import css from './styles.module.css'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { isValidElement } from 'react'

type TxTypeProps = {
  tx: Transaction
}

export const TxTypeIcon = ({ tx }: TxTypeProps) => {
  const type = useTransactionType(tx)

  return (
    <div className={css.txType}>
      {isValidElement(type.icon) ? (
        type.icon
      ) : typeof type.icon == 'string' ? (
        <SafeAppIconCard
          src={type.icon}
          alt={type.text}
          width={16}
          height={16}
          fallback="/images/transactions/custom.svg"
        />
      ) : null}
    </div>
  )
}

export const TxTypeText = ({ tx }: TxTypeProps) => {
  const type = useTransactionType(tx)

  return type.text
}

const TxType = ({ tx }: TxTypeProps) => {
  const type = useTransactionType(tx)

  return (
    <div className={css.txType}>
      {isValidElement(type.icon) ? (
        type.icon
      ) : typeof type.icon == 'string' ? (
        <SafeAppIconCard
          src={type.icon}
          alt={type.text}
          width={16}
          height={16}
          fallback="/images/transactions/custom.svg"
        />
      ) : null}

      <span className={css.txTypeText}>{type.text}</span>
    </div>
  )
}

export default TxType
