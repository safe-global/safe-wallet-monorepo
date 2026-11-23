import { useRouter } from 'next/router'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import useChains from '@/hooks/useChains'

/** The `?safe=` value (prefix as chain ID or short name) as a `chainId:address` key, or undefined when it names no Safe. */
export const safeParamToKey = (param: string, chains: Pick<Chain, 'chainId' | 'shortName'>[]): string | undefined => {
  const { prefix, address } = parsePrefixedAddress(param)
  if (!prefix || !address || !isValidAddress(address)) return undefined
  const chainId = /^\d+$/.test(prefix)
    ? prefix
    : chains.find((chain) => chain.shortName.toLowerCase() === prefix.toLowerCase())?.chainId
  return chainId ? `${chainId}:${address}` : undefined
}

/** The Safe that the link into the onboarding names, to preselect on the Safes step. */
export const useSafeFromUrl = (): string | undefined => {
  const router = useRouter()
  const { configs: chains } = useChains()
  const param = typeof router.query.safe === 'string' ? router.query.safe : ''
  return safeParamToKey(param, chains)
}
