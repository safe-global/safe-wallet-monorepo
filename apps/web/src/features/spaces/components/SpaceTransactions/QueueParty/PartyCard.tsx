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
}

/** The party card's content, with its actions. Rendered only while the card is open. */
const PartyCard = ({ address, chainId, name, network, avatar }: PartyCardProps): ReactElement => {
  const actions = useQueuePartyActions(address, chainId, !!name)
  return <QueuePartyCard {...actions} avatar={avatar} title={getPartyTitle(name, network)} address={address} />
}

export default PartyCard
