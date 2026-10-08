import type { ReactNode, RefObject } from 'react'
import Popup from '@/components/common/Popup'
import WcIcon from './WcIcon'

export type WcHeaderWidgetViewProps = {
  children: ReactNode
  iconRef: RefObject<HTMLDivElement | null>
  sessionCount: number
  sessionIcon?: string
  isError: boolean
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export const WcHeaderWidgetView = ({
  children,
  iconRef,
  sessionCount,
  sessionIcon,
  isError,
  isOpen,
  onOpen,
  onClose,
}: WcHeaderWidgetViewProps) => {
  return (
    <>
      <div ref={iconRef}>
        <WcIcon onClick={onOpen} sessionCount={sessionCount} sessionIcon={sessionIcon} isError={isError} />
      </div>

      <Popup keepMounted anchorEl={iconRef.current} open={isOpen} onClose={onClose} transitionDuration={0}>
        {children}
      </Popup>
    </>
  )
}
