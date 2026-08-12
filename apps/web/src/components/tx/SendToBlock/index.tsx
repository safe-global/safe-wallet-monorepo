import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import FieldsGrid from '../FieldsGrid'

const SendToBlock = ({
  address,
  title = 'Recipient',
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
    <FieldsGrid title={title}>
      <div className="text-sm leading-5">
        <NamedAddressInfo
          address={address}
          name={name}
          shortAddress={false}
          hasExplorer
          showCopyButton
          avatarSize={avatarSize}
          customAvatar={customAvatar}
        />
      </div>
    </FieldsGrid>
  )
}

export default SendToBlock
