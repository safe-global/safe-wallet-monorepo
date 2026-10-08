import type { ReactNode } from 'react'
import React, { type ReactElement } from 'react'
import ConfirmCopyModal from './ConfirmCopyModal'
import useCopyTooltip from './useCopyTooltip'
import { CopyTooltipView } from '@views/components/common/CopyTooltip/CopyTooltipView'

const CopyTooltip = ({
  text,
  children,
  initialToolTipText,
  onCopy,
  dialogContent,
}: {
  text: string
  children?: ReactNode
  initialToolTipText?: string
  onCopy?: () => void
  dialogContent?: ReactElement
}): ReactElement => {
  const { status, showTooltip, setShowTooltip, showConfirmation, closeConfirmation, handleCopy } = useCopyTooltip({
    text,
    onCopy,
    needsConfirmation: !!dialogContent,
  })

  return (
    <CopyTooltipView
      status={status}
      initialToolTipText={initialToolTipText}
      showTooltip={showTooltip}
      onShowTooltipChange={setShowTooltip}
      onCopy={handleCopy}
      dialog={
        dialogContent !== undefined ? (
          <ConfirmCopyModal onClose={closeConfirmation} onCopy={handleCopy} open={showConfirmation}>
            {dialogContent}
          </ConfirmCopyModal>
        ) : undefined
      }
    >
      {children}
    </CopyTooltipView>
  )
}

export default CopyTooltip
