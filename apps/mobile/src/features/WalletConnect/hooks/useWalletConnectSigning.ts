import { useCallback } from 'react'
import { useProvider } from '@reown/appkit-react-native'
import type { SafeVersion } from '@safe-global/types-kit'
import {
  signWithWalletConnect,
  type WalletConnectSigningParams,
  type SigningResponse,
} from '@/src/services/walletconnect/walletconnect-signing.service'

type SignParams = Omit<WalletConnectSigningParams, 'provider' | 'safeVersion'> & {
  safeVersion?: string
}

/**
 * Provides a sign function that delegates to the WalletConnect signing service.
 * The provider is resolved internally from the active AppKit session.
 * Validates that the provider and safe version are available before signing.
 */
export function useWalletConnectSigning() {
  const { provider } = useProvider()

  const sign = useCallback(
    async (params: SignParams): Promise<SigningResponse> => {
      if (!provider) {
        throw new Error('WalletConnect provider not available')
      }

      if (!params.safeVersion) {
        throw new Error('Safe version not available for WalletConnect signing')
      }

      return signWithWalletConnect({
        ...params,
        safeVersion: params.safeVersion as SafeVersion,
        provider,
      })
    },
    [provider],
  )

  return { sign, hasProvider: Boolean(provider) }
}
