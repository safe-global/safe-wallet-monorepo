import Popup from '@/components/common/Popup'
import { useRef, useState } from 'react'
import OpenLVIcon from './OpenLVIcon.svg'
import { TryItOut } from './OpenLVWidgetUI'

export const OpenLVHeaderWidget = () => {
  const iconRef = useRef<HTMLDivElement>(null)

  const [isOpen, setOpen] = useState(false)

  return (
    <>
      <div style={{ padding: '0 16px', cursor: 'pointer' }} ref={iconRef}>
        <OpenLVIcon height={24} width={24} onClick={() => setOpen(!isOpen)} />
      </div>

      <Popup keepMounted anchorEl={iconRef.current} onClose={() => setOpen(false)} open={isOpen} transitionDuration={0}>
        <TryItOut />
      </Popup>
    </>
  )
}
