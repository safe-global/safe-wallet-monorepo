import type { ReactElement, ReactNode } from 'react'
import { getPartyTitle, QueuePartyCard } from '@safe-global/views/features/spaces/components/SpaceQueue/QueuePartyCard'
import { useQueuePartyActions } from './useQueuePartyActions'

type PartyCardProps = {
  address: string
  chainId: string
  /** Undefined when the address book doesn't name the address */
  name?: string
  /** Said after the name, for a Safe */
  network?: string
  avatar: ReactNode
  /** A Safe's home page, for the card's Open Safe action */
  safeHref?: string
}

/** The party card's content, with its actions. Rendered only while the card is open. */
const PartyCard = ({ address, chainId, name, network, avatar, safeHref }: PartyCardProps): ReactElement => {
  const actions = useQueuePartyActions(address, chainId, !!name)
  return (
    <QueuePartyCard
      {...actions}
      safeHref={safeHref}
      avatar={avatar}
      title={getPartyTitle(name, network)}
      address={address}
    />
  )
}

export default PartyCard
