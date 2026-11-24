import type { ReactElement } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'

const AssetLogo = ({ src, label }: { src?: string | null; label: string }): ReactElement => (
  <Avatar size="sm">
    {src && <AvatarImage src={src} alt="" />}
    <AvatarFallback>{label.slice(0, 1).toUpperCase()}</AvatarFallback>
  </Avatar>
)

export default AssetLogo
