import EthHashInfo from '@/components/common/EthHashInfo'
import { cn } from '@/utils/cn'

// The address as both address-book tables render it: its own column on desktop, and under the
// name in the compact layout, which drops that column.
const AddressCell = ({ address, isCompact = false }: { address: string; isCompact?: boolean }) => (
  <div
    className={cn(
      'font-mono [&_a]:size-4 [&_button]:size-4 [&_svg]:size-4',
      isCompact ? 'text-muted-foreground text-xs font-normal' : 'text-[0.8em]',
    )}
  >
    <EthHashInfo
      address={address}
      shortAddress={isCompact}
      showAvatar={!isCompact}
      showPrefix={false}
      showName={false}
      highlight4bytes
      hasExplorer
      showCopyButton
      avatarSize={24}
    />
  </div>
)

export default AddressCell
