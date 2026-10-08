import useCopyTooltip from '../CopyTooltip/useCopyTooltip'
import { CopyAddressIconButtonView } from '@views/components/common/CopyAddressIconButton/CopyAddressIconButtonView'

/** Inline copy-address affordance for account rows/cards, with the same copy logic as CopyTooltip. */
const CopyAddressIconButton = ({ address, ...viewProps }: { address: string; className?: string }) => {
  const { status, showTooltip, setShowTooltip, handleCopy } = useCopyTooltip({
    text: address,
    needsConfirmation: false,
  })

  return (
    <CopyAddressIconButtonView
      {...viewProps}
      status={status}
      showTooltip={showTooltip}
      onShowTooltipChange={setShowTooltip}
      onCopy={handleCopy}
    />
  )
}

export default CopyAddressIconButton
