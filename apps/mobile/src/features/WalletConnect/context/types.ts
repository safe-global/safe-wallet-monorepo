/**
 * Shared contract for the WalletConnect context.
 *
 * Both the real provider ([WalletConnectContext.tsx](./WalletConnectContext.tsx))
 * and the e2e mock ([WalletConnectContext.e2e.tsx](./WalletConnectContext.e2e.tsx))
 * MUST conform to this interface. Any drift between them surfaces as a
 * TypeScript error rather than a runtime crash in tests.
 *
 * Imports here use `import type` so this module remains type-only — pulling
 * it into the e2e build does not drag in production-only modules at runtime.
 */
import type { useAccount, useAppKit, useWalletInfo } from '@reown/appkit-react-native'
import type { Provider } from '@reown/appkit-common-react-native'
import type { useImportSignerFlow } from '../hooks/useImportSignerFlow'
import type { useReconnectFlow } from '../hooks/useReconnectFlow'
import type { useSwitchNetwork } from '../hooks/useSwitchNetwork'
import type { useWalletConnectSigning } from '../hooks/useWalletConnectSigning'

export interface WalletConnectContextValue
  extends Pick<ReturnType<typeof useImportSignerFlow>, 'initiateConnection'>,
    Pick<ReturnType<typeof useReconnectFlow>, 'reconnect'>,
    Pick<ReturnType<typeof useSwitchNetwork>, 'switchNetwork' | 'switchNetworkIfNeeded' | 'isWrongNetwork'>,
    Pick<ReturnType<typeof useWalletConnectSigning>, 'sign' | 'hasProvider'> {
  provider: Provider | undefined
  isWalletConnectSigner: (address: string) => boolean
  isConnected: ReturnType<typeof useAccount>['isConnected']
  address: ReturnType<typeof useAccount>['address']
  chainId: ReturnType<typeof useAccount>['chainId']
  walletInfo: ReturnType<typeof useWalletInfo>['walletInfo']
  disconnect: ReturnType<typeof useAppKit>['disconnect']
  open: ReturnType<typeof useAppKit>['open']
}
