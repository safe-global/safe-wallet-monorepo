import { type ReactNode, useRef } from 'react'
import type { SessionTypes } from '@walletconnect/types'
import Popup from '@/components/common/Popup'
import WcIcon from './WcIcon'

type WcHeaderWidgetProps = {
  children: ReactNode
  sessions: SessionTypes.Struct[]
  isError: boolean
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

const WcHeaderWidget = ({ sessions, ...props }: WcHeaderWidgetProps) => {
  const iconRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <div ref={iconRef}>
        <WcIcon
          onClick={props.onOpen}
          sessionCount={sessions.length}
          sessionIcon={sessions[0]?.peer.metadata.icons[0]}
          isError={props.isError}
        />
      </div>

      <Popup keepMounted anchorEl={iconRef.current} open={props.isOpen} onClose={props.onClose} transitionDuration={0}>
        {props.children}
      </Popup>
    </>
  )
}

export default WcHeaderWidget
