import useChainId from '@/hooks/useChainId'

const UNSUPPORTED_CHAIN_LIST = ['204']
export const useIsUnsupportedChain = () => {
  const chainId = useChainId()

  return UNSUPPORTED_CHAIN_LIST.includes(String(chainId))
}
