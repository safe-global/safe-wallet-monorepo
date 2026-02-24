import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { getDeterministicColor } from '@/features/spaces/components/InitialsAvatar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const SafeAvatar = ({ name, address }: { name: string | undefined; address: string }) => {
  const displayName = name || shortenAddress(address)
  const initial = displayName.charAt(0).toUpperCase()
  const bgColor = getDeterministicColor(displayName)

  return (
    <Avatar>
      <AvatarFallback style={{ backgroundColor: bgColor, color: 'white' }}>{initial}</AvatarFallback>
    </Avatar>
  )
}

export default SafeAvatar
