import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { SendToBlockView } from '@views/components/tx/SendToBlock/SendToBlockView'

const SendToBlock = ({
  address,
  title,
  customAvatar,
  avatarSize,
  name,
}: {
  address: string
  name?: string | null
  title?: string
  customAvatar?: string | null
  avatarSize?: number
}) => {
  return (
    <SendToBlockView
      title={title}
      addressInfo={
        <NamedAddressInfo
          address={address}
          name={name}
          shortAddress={false}
          hasExplorer
          showCopyButton
          showPrefix={false}
          avatarSize={avatarSize}
          customAvatar={customAvatar}
        />
      }
    />
  )
}

export default SendToBlock
