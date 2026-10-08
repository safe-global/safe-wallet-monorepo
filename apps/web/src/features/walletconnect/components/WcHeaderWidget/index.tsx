import { type ReactNode, useRef } from 'react'
import type { SessionTypes } from '@walletconnect/types'
import { WcHeaderWidgetView } from '@views/features/walletconnect/components/WcHeaderWidget/WcHeaderWidgetView'

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
    <WcHeaderWidgetView
      iconRef={iconRef}
      sessionCount={sessions.length}
      sessionIcon={sessions[0]?.peer.metadata.icons[0]}
      isError={props.isError}
      isOpen={props.isOpen}
      onOpen={props.onOpen}
      onClose={props.onClose}
    >
      {props.children}
    </WcHeaderWidgetView>
  )
}

export default WcHeaderWidget
