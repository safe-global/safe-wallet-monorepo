import CopyAddressButton from './CopyAddressButton'
import { SafeInfoDisplayView, type SafeInfoDisplayProps } from '@views/components/common/AccountRow/SafeInfoDisplayView'

export type { SafeInfoDisplayProps }

const SafeInfoDisplay = (props: SafeInfoDisplayProps) => (
  <SafeInfoDisplayView
    {...props}
    copyButton={<CopyAddressButton address={props.address} testId="safe-item-copy-address" />}
  />
)

export default SafeInfoDisplay
