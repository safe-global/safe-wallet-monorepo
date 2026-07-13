import { useEffect, useRef, useSyncExternalStore } from 'react'
import { StyleSheet, View as RNView } from 'react-native'
import { useAppSelector } from '@/src/store/hooks'
import { selectOutstandingRequests } from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'
import { walletKitE2eState } from '@/src/features/WalletConnect/Wallet/walletKitE2eState'

/**
 * Side-channel for the WalletConnect tx-request flows: surfaces what the fake
 * respondSessionRequest() delivered to the "dApp" as 1x1 markers Maestro can assert.
 *
 *  - `e2e-wc-response-error-<code>`  — an error was delivered (4100 read-only, 5000 USER_REJECTED, …)
 *  - `e2e-wc-response-hash-match`    — eth_sendTransaction: bare result === the handed-off safeTxHash
 *  - `e2e-wc-response-5792-match`    — wallet_sendCalls: result is exactly `{ id: safeTxHash }`
 *
 * The expected hash is the outstandingRequests key observed while the tx was in
 * review; it's kept in a ref because the propose-success listener clears the
 * entry in the same tick it responds.
 */

/** EIP-5792 send envelope: an object whose ONLY key is `id`, holding the safeTxHash. */
const isBundleEnvelope = (result: unknown, safeTxHash: string): boolean =>
  typeof result === 'object' &&
  result !== null &&
  !Array.isArray(result) &&
  Object.keys(result).length === 1 &&
  (result as { id?: unknown }).id === safeTxHash

export function WcResponseIndicator() {
  const response = useSyncExternalStore(walletKitE2eState.subscribe, () => walletKitE2eState.get().lastRequestResponse)
  const outstanding = useAppSelector(selectOutstandingRequests)
  const lastHashRef = useRef<string | null>(null)

  const hashes = Object.keys(outstanding)
  useEffect(() => {
    if (hashes.length > 0) {
      lastHashRef.current = hashes[hashes.length - 1]
    }
  })

  if (!response) {
    return null
  }

  const markers: string[] = []
  if (response.error) {
    markers.push(`e2e-wc-response-error-${response.error.code}`)
  } else if ('result' in response && lastHashRef.current) {
    if (response.result === lastHashRef.current) {
      markers.push('e2e-wc-response-hash-match')
    } else if (isBundleEnvelope(response.result, lastHashRef.current)) {
      markers.push('e2e-wc-response-5792-match')
    }
  }

  return (
    <>
      {markers.map((testID) => (
        // Plain RN View so testID maps to accessibilityIdentifier reliably (see WcRejectIndicator).
        <RNView key={testID} testID={testID} style={styles.marker} />
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  marker: {
    height: 1,
    width: 1,
    backgroundColor: 'red',
  },
})
