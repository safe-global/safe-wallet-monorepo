import { blo } from 'blo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TruncatedText, getInitials, getSafeDisplayInfo } from '@/components/common/AccountRow'

/**
 * Identity block shared by the rows, the group header and the trigger. Renders two siblings for its
 * parent's flex row. Not `SafeInfoDisplay`: that renders a copy button, and an interactive control
 * inside a `role="option"` swallows the click that should select the row.
 */
const SafeIdentity = ({ address, name }: { address: string; name?: string }) => {
  const { displayName, shortAddress } = getSafeDisplayInfo(name ?? '', address)

  return (
    <>
      <Avatar size="sm" className="shrink-0">
        <AvatarImage src={blo(address as `0x${string}`)} alt={displayName} />
        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>

      {/* max-w-full: `items-start` sizes children to their content, so a long name or the address would
          otherwise paint over the threshold badge instead of ellipsizing. */}
      <span className="flex min-w-0 flex-1 flex-col items-start">
        <TruncatedText variant="paragraph-small-medium" className="block min-w-0 max-w-full" text={displayName} />
        <TruncatedText
          variant="paragraph-mini"
          color="muted"
          className="block min-w-0 max-w-full font-mono"
          text={shortAddress}
          fullText={address}
          data-testid="safe-account-address"
        />
      </span>
    </>
  )
}

export default SafeIdentity
