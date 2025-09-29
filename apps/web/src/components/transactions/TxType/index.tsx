import { useTransactionType } from '@/hooks/useTransactionType'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import { Box } from '@mui/material'
import css from './styles.module.css'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { isValidElement } from 'react'

type TxTypeProps = {
  tx: TransactionSummary
}

export const TxTypeIcon = ({ tx }: TxTypeProps) => {
  const type = useTransactionType(tx)

  return (
    <Box className={css.txType}>
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
    </Box>
  )
}

export const TxTypeText = ({ tx }: TxTypeProps) => {
  const type = useTransactionType(tx)

  return type.text
}

const TxType = ({ tx }: TxTypeProps) => {
  const type = useTransactionType(tx)

  return (
    <Box className={css.txType}>
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
    </Box>
  )
}

export default TxType
