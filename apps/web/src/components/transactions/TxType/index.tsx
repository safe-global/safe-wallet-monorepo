import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTransactionType } from '@/hooks/useTransactionType'
import { TxTypeIconView, TxTypeView } from '@views/components/transactions/TxType/TxTypeView'

type TxTypeProps = {
  tx: Transaction
}

export const TxTypeIcon = ({ tx }: TxTypeProps) => {
  const type = useTransactionType(tx)

  return <TxTypeIconView icon={type.icon} text={type.text} />
}

export const TxTypeText = ({ tx }: TxTypeProps) => {
  const type = useTransactionType(tx)

  return type.text
}

const TxType = ({ tx }: TxTypeProps) => {
  const type = useTransactionType(tx)

  return <TxTypeView icon={type.icon} text={type.text} />
}

export default TxType
