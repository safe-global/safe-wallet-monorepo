import EthHashInfo from '@/components/common/EthHashInfo'
import { Typography } from '@/components/ui/typography'

import css from './styles.module.css'

export type SpenderFieldViewProps = {
  address: string
  name?: string
  customAvatar?: string
  shortAddress: boolean
}

export const SpenderFieldView = ({ address, name, customAvatar, shortAddress }: SpenderFieldViewProps) => {
  return (
    <div className={`${css.approvalField} flex flex-row items-center justify-between gap-4`}>
      <Typography variant="paragraph-small" className="text-muted-foreground">
        Spender
      </Typography>
      <div className="overflow-hidden">
        <EthHashInfo
          avatarSize={24}
          address={address}
          name={name}
          customAvatar={customAvatar}
          shortAddress={shortAddress}
          hasExplorer
        />
      </div>
    </div>
  )
}
