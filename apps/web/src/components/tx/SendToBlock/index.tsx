import { Typography } from '@mui/material'
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
  name?: string
  title?: string
  customAvatar?: string
  avatarSize?: number
}) => {
  return (
    <FieldsGrid title={title}>
      <Typography variant="body2" component="div">
        <NamedAddressInfo
          address={address}
          name={name}
          shortAddress={false}
          hasExplorer
          showCopyButton
          avatarSize={avatarSize}
          customAvatar={customAvatar}
        />
      </Typography>
    </FieldsGrid>
  )
}

export default SendToBlock
