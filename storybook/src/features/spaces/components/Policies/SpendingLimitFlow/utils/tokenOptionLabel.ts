import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { TokenOption } from '@/features/spaces/components/Policies/SpendingLimitFlow/utils/tokenOptions'

/** What the input shows for a selected option: symbol, else name, else the shortened address. */
export const tokenOptionLabel = (option: TokenOption): string =>
  option.symbol || option.name || shortenAddress(option.address)
