import { useCallback } from 'react'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useSpendingLimitTokenOptions from '../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions'
import { findTokenOption, tokenOptionLabel } from '../../SpendingLimitFlow/utils/tokenOptions'

export type AllowlistAddressInfo = Omit<AddressInfo, 'value'>

type NamedAddress = { address: string; name?: string }

const NONE: readonly NamedAddress[] = []

/** Names an address in an allowlist rule: a token option, else one of `named`, else the address book on the Safe's chain. */
export const useAllowlistAddressInfo = (
  named: readonly NamedAddress[] = NONE,
): ((address: string) => AllowlistAddressInfo) => {
  const chainId = useSafeScope()?.chainId
  const { options } = useSpendingLimitTokenOptions()
  const resolveName = useSafeNameResolver()

  return useCallback(
    (address: string) => {
      const token = findTokenOption(options, address)
      if (token) return { name: tokenOptionLabel(token), logoUri: token.logoUri }
      const known = named.find((item) => sameAddress(item.address, address))
      return { name: known?.name || resolveName(address, chainId) || undefined }
    },
    [options, named, resolveName, chainId],
  )
}
