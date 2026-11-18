import { isAddress } from 'ethers'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Avatar, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import TruncatedText from '@safe-global/views/components/common/AccountRow/TruncatedText'
import { getInitials } from '@safe-global/views/components/common/AccountRow/utils'

export const EmptyCell = () => <span className="text-muted-foreground text-xs">&mdash;</span>

/** A member's name, or their shortened wallet address, beside an initials avatar. */
const AddedBy = ({ name }: { name?: string }) =>
  name ? (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Avatar size="xs">
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      <TruncatedText
        variant="paragraph-small"
        className="min-w-0"
        text={isAddress(name) ? shortenAddress(name) : name}
        fullText={isAddress(name) ? name : undefined}
      />
    </span>
  ) : (
    <EmptyCell />
  )

export default AddedBy
