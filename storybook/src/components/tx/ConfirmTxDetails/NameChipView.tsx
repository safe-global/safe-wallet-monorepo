import EthHashInfo from '@/components/common/EthHashInfo'
import { Chip } from '@/components/ui/chip'

export type NameChipViewProps = {
  address: string
  name?: string | null
  logo?: string | null
  isUntrusted?: boolean
}

export const NameChipView = ({ address, name, logo, isUntrusted }: NameChipViewProps) => {
  return (
    <Chip data-testid="name-chip" size="auto" variant={isUntrusted ? 'negative' : 'default'}>
      <EthHashInfo address={address} name={name} customAvatar={logo} showAvatar={!!logo} avatarSize={20} onlyName />
    </Chip>
  )
}
