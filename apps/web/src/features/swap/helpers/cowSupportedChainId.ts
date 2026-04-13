import { SupportedChainId } from '@cowprotocol/cow-sdk'

const COW_SUPPORTED_CHAIN_IDS = new Set<number>(
  Object.values(SupportedChainId).filter((value): value is number => typeof value === 'number'),
)

export const parseCowSupportedChainId = (chainId: string): SupportedChainId => {
  const parsed = Number.parseInt(chainId, 10)
  if (!Number.isFinite(parsed) || !COW_SUPPORTED_CHAIN_IDS.has(parsed)) {
    return SupportedChainId.MAINNET
  }
  return parsed
}
