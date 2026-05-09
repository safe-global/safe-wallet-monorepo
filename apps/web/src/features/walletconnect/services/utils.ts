import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ProposalTypes, SessionTypes } from '@walletconnect/types'
import { EIP155, BlockedBridges, WarnedBridges, WarnedBridgeNames } from '../constants'

export const isPairingUri = (uri: string): boolean => {
  return uri.startsWith('wc:')
}

export const getEip155ChainId = (chainId: string): string => {
  return `${EIP155}:${chainId}`
}

export const stripEip155Prefix = (eip155Address: string): string => {
  return eip155Address.split(':').pop() ?? ''
}

export const getSupportedEip155ChainIds = (
  requiredNamespaces: ProposalTypes.RequiredNamespaces,
  optionalNamespaces: ProposalTypes.OptionalNamespaces,
): Array<string> => {
  const requiredChains = requiredNamespaces[EIP155]?.chains ?? []
  const optionalChains = optionalNamespaces[EIP155]?.chains ?? []

  return requiredChains.concat(optionalChains)
}

export const getSupportedChainIds = (
  configs: Array<Chain>,
  { requiredNamespaces, optionalNamespaces }: ProposalTypes.Struct,
): Array<string> => {
  const supportedEip155ChainIds = getSupportedEip155ChainIds(requiredNamespaces, optionalNamespaces)

  return configs
    .filter((chain) => {
      const eipChainId = getEip155ChainId(chain.chainId)
      return supportedEip155ChainIds.includes(eipChainId)
    })
    .map((chain) => chain.chainId)
}

export const isUnsupportedChain = (session: SessionTypes.Struct, chainId: string) => {
  const supportedEip155ChainIds = getSupportedEip155ChainIds(session.requiredNamespaces, session.optionalNamespaces)

  const eipChainId = getEip155ChainId(chainId)
  return !supportedEip155ChainIds.includes(eipChainId)
}

// Bridge enforces the same address on destination chain
export const isBlockedBridge = (origin: string) => {
  return BlockedBridges.some((bridge) => origin.includes(bridge))
}

// Bridge defaults to same address on destination chain but allows changing it
export const isWarnedBridge = (origin: string, name: string) => {
  return WarnedBridges.some((bridge) => origin.includes(bridge)) || WarnedBridgeNames.includes(name)
}

export const getPeerName = (peer: SessionTypes.Struct['peer'] | ProposalTypes.Struct['proposer']): string => {
  return peer.metadata?.name || peer.metadata?.url || ''
}

export const splitError = (message: string): string[] => {
  return message.split(/: (.+)/).slice(0, 2)
}
