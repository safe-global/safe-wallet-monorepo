import { isAddress } from 'ethers'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { cn } from '@safe-global/views/utils/cn'

const GROUP_SIZE = 4

/**
 * The full 42-character address, checksummed, split into groups of four hex characters. The first
 * and last group carry full contrast; the middle groups are muted so the eye lands on the parts that
 * tell look-alike addresses apart. Never shortened: in the compact table it wraps between groups instead.
 */
const GroupedAddress = ({ address, className }: { address: string; className?: string }) => {
  const checksummed = checksumAddress(address)
  const isValid = isAddress(checksummed)
  const hex = isValid ? checksummed.slice(2) : checksummed
  const groups = hex.match(new RegExp(`.{1,${GROUP_SIZE}}`, 'g')) ?? []

  return (
    <span
      data-testid="grouped-address"
      className={cn('inline-flex gap-[0.35ch] font-mono text-xs tabular-nums whitespace-nowrap', className)}
    >
      {isValid && <span className="text-muted-foreground">0x</span>}
      {groups.map((group, index) => (
        <span
          // Position is the identity: a group's text repeats across an address.
          key={index}
          className={index === 0 || index === groups.length - 1 ? 'text-foreground' : 'text-muted-foreground'}
        >
          {group}
        </span>
      ))}
    </span>
  )
}

export default GroupedAddress
