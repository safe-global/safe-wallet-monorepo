import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

export const getAvailableChainsNames = (chains: Chain[]) => {
  if (chains.length === 0) {
    return ''
  }

  if (chains.length === 1) {
    return chains[0].chainName
  }

  return (
    chains
      .slice(0, -1)
      .map((chain) => chain.chainName)
      .join(', ') +
    ' and ' +
    chains[chains.length - 1].chainName
  )
}
