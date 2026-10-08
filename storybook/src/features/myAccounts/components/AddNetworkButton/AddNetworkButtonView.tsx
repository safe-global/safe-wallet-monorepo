import type { ReactNode } from 'react'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import { Button } from '@/components/ui/button'
import PlusIcon from '@/public/images/common/plus.svg'

export type AddNetworkButtonViewProps = {
  onOpen: () => void
  dialog: ReactNode
}

export const AddNetworkButtonView = ({ onOpen, dialog }: AddNetworkButtonViewProps) => {
  return (
    <>
      <Track {...OVERVIEW_EVENTS.ADD_NEW_NETWORK} label={OVERVIEW_LABELS.sidebar}>
        <Button data-testid="add-network-btn" variant="ghost" className="w-full" onClick={onOpen}>
          <PlusIcon /> Add another network
        </Button>
      </Track>

      {dialog}
    </>
  )
}
