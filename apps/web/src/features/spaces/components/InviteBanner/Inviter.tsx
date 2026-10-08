import { isAddress } from 'ethers'
import { type ComponentProps } from 'react'
import { InviterView } from '@views/features/spaces/components/InviteBanner/InviterView'

type InviterProps = {
  invitedByName: string | undefined
  variant: ComponentProps<typeof InviterView>['variant']
  avatarSize: number
}

const Inviter = ({ invitedByName, variant, avatarSize }: InviterProps) => {
  if (!invitedByName) return null

  return (
    <InviterView
      invitedByName={invitedByName}
      isAddress={isAddress(invitedByName)}
      variant={variant}
      avatarSize={avatarSize}
    />
  )
}

export default Inviter
