import { type ReactElement, useEffect, useState } from 'react'

import SuccessIcon from '@/public/images/common/success.svg'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import { CustomTooltip } from '@/components/common/CustomTooltip'

/**
 * @deprecated Used only by the legacy MUI BatchIndicator.
 * Remove this entire directory once the Header migration to TopBar is complete.
 * New code should use `@/features/batching/components/BatchTooltip` instead.
 */
const BatchTooltip = ({ children }: { children: ReactElement }) => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false)

  // Click outside to close the tooltip
  useEffect(() => {
    const handleClickOutside = () => setShowTooltip(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Show tooltip when tx is added to batch
  useEffect(() => {
    return txSubscribe(TxEvent.BATCH_ADD, () => setShowTooltip(true))
  }, [])

  return (
    <CustomTooltip
      open={showTooltip}
      onClose={() => setShowTooltip(false)}
      title={
        <div className="flex flex-col items-center gap-4 p-4">
          <SuccessIcon className="size-[53px]" />
          Transaction is added to batch
        </div>
      }
    >
      <div>{children}</div>
    </CustomTooltip>
  )
}

export default BatchTooltip
