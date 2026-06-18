import { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'

export type ScannedAddress = { address: string; prefix?: string }

// Recognises a scanned QR value as an Ethereum (optionally `prefix:`-tagged) address. Returns null
// for anything else — WalletConnect URIs, URLs, junk — so callers can fall back to their own
// handling. `parsePrefixedAddress` never throws (it leaves non-addresses unchanged), so feeding it
// arbitrary scanner output is safe.
export const resolveScannedAddress = (raw: string): ScannedAddress | null => {
  const { address, prefix } = parsePrefixedAddress(raw)
  return isValidAddress(address) ? { address, prefix } : null
}

type NavigateMode = 'dismissTo' | 'replace'

// Shared address-to-Send logic for both QR scanners: the in-Send scanner (`/(send)/scan-qr`) and the
// header scanner (`/wallet-connect-scan`). Owns the chain-mismatch warning and navigation into the
// Send flow with the recipient prefilled. The camera lifecycle and invalid-address error display
// stay with each scanner since they differ.
export const useScannedAddressToSend = () => {
  const router = useRouter()
  const toast = useToastController()
  const activeChain = useAppSelector(selectActiveChain)

  const warnChainMismatch = useCallback(
    (prefix: string | undefined) => {
      const activeShortName = activeChain?.shortName

      if (!prefix || !activeShortName || prefix === activeShortName) {
        return
      }

      toast.show(`Address is for ${prefix}, but active chain is ${activeShortName}`, { native: false, duration: 3000 })
    },
    [activeChain?.shortName, toast],
  )

  // `dismissTo` pops back to the recipient screen already in the Send stack (the in-Send scanner).
  // `replace` swaps the standalone scanner modal for the Send flow so the back stack matches the
  // home-screen Send button (tabs → recipient).
  const navigateToRecipient = useCallback(
    (address: string, mode: NavigateMode = 'dismissTo') => {
      const target = {
        pathname: '/(send)/recipient' as const,
        params: { scannedAddress: address, scanTimestamp: Date.now().toString() },
      }

      if (mode === 'replace') {
        router.replace(target)
      } else {
        router.dismissTo(target)
      }
    },
    [router],
  )

  return { warnChainMismatch, navigateToRecipient }
}
