import { type ReactElement } from 'react'
import { ArrowDown } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'
import EthHashInfo from '@/components/common/EthHashInfo'

export type SendFromBlockViewProps = {
  title?: string
  address: string
}

export const SendFromBlockView = ({ title, address }: SendFromBlockViewProps): ReactElement => {
  return (
    <div className={`${css.container} mb-4 pb-4`}>
      <Typography className="pb-2 text-[var(--color-text-secondary)]">{title || 'Sending from'}</Typography>

      <div className="text-sm leading-5">
        <EthHashInfo address={address} shortAddress={false} hasExplorer showCopyButton />
      </div>

      <ArrowDown className={css.arrow} />
    </div>
  )
}
