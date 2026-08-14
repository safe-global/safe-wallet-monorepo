import { type ReactElement } from 'react'
import { ArrowDown } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'
import useSafeAddress from '@/hooks/useSafeAddress'
import EthHashInfo from '@/components/common/EthHashInfo'

// TODO: Remove this file after replacing in all tx flow components
const SendFromBlock = ({ title }: { title?: string }): ReactElement => {
  const address = useSafeAddress()

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

export default SendFromBlock
