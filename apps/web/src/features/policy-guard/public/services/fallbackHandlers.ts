import { getTokenCallbackHandlerDeployment } from '@safe-global/safe-deployments'
import { sameAddress } from '@safe-global/utils/utils/addresses'

// It confirms no signature, so with it no off-chain signature of the Safe passes
export const getTokenCallbackHandlerAddress = (chainId: string): string | undefined =>
  getTokenCallbackHandlerDeployment({ version: '1.5.0', network: chainId })?.networkAddresses[chainId]

export const isTokenCallbackHandler = (chainId: string, address?: string | null): boolean =>
  !!address && sameAddress(getTokenCallbackHandlerAddress(chainId), address)
