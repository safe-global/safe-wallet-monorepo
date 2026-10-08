import { isValidElement, type ReactElement } from 'react'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import css from './styles.module.css'

export type TxTypeViewProps = {
  icon: string | ReactElement
  text: string
}

const TxTypeIconContent = ({ icon, text }: TxTypeViewProps) =>
  isValidElement(icon) ? (
    icon
  ) : typeof icon == 'string' ? (
    <SafeAppIconCard src={icon} alt={text} width={16} height={16} fallback="/images/transactions/custom.svg" />
  ) : null

export const TxTypeIconView = ({ icon, text }: TxTypeViewProps) => {
  return (
    <div className={css.txType}>
      <TxTypeIconContent icon={icon} text={text} />
    </div>
  )
}

export const TxTypeView = ({ icon, text }: TxTypeViewProps) => {
  return (
    <div className={css.txType}>
      <TxTypeIconContent icon={icon} text={text} />

      <span className={css.txTypeText}>{text}</span>
    </div>
  )
}
