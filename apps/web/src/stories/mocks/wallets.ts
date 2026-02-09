import type { WalletContextType } from '@/components/common/WalletProvider'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { WalletPreset } from './types'

/**
 * Disconnected wallet state - no wallet connected
 */
export const disconnectedWallet: WalletContextType = {
  connectedWallet: null,
  signer: null,
  setSignerAddress: () => {},
}

/**
 * Creates a connected wallet context for a given Safe
 *
 * @param safeData - Safe fixture data to derive wallet from
 * @param ownerIndex - Index of owner to use as connected wallet (default: 0)
 * @param options - Additional wallet options
 * @returns WalletContextType with connected wallet state
 */
export function createConnectedWallet(
  safeData: SafeState,
  ownerIndex = 0,
  options: { balance?: string; label?: string } = {},
): WalletContextType {
  const ownerAddress = safeData.owners[ownerIndex]?.value
  const chainId = safeData.chainId

  if (!ownerAddress) {
    console.warn(`Owner at index ${ownerIndex} not found, falling back to disconnected wallet`)
    return disconnectedWallet
  }

  return {
    connectedWallet: {
      address: ownerAddress,
      chainId,
      label: options.label ?? 'MetaMask',
      provider: null as never,
      balance: options.balance ?? '10.0',
    },
    signer: {
      address: ownerAddress,
      chainId,
      provider: null,
    },
    setSignerAddress: () => {},
  }
}

/**
 * Creates a non-owner wallet context (wallet connected but not a Safe owner)
 *
 * @param chainId - Chain ID for the wallet
 * @param options - Additional wallet options
 * @returns WalletContextType with non-owner wallet state
 */
export function createNonOwnerWallet(
  chainId: string,
  options: { address?: string; balance?: string; label?: string } = {},
): WalletContextType {
  const address = options.address ?? '0x1234567890123456789012345678901234567890'

  return {
    connectedWallet: {
      address,
      chainId,
      label: options.label ?? 'MetaMask',
      provider: null as never,
      balance: options.balance ?? '1.0',
    },
    signer: {
      address,
      chainId,
      provider: null,
    },
    setSignerAddress: () => {},
  }
}

/**
 * Get wallet context for a preset name or return custom wallet as-is
 *
 * @param preset - Wallet preset name or custom WalletContextType
 * @param safeData - Safe data for deriving owner wallets
 * @returns WalletContextType for the specified preset
 */
export function resolveWallet(preset: WalletPreset | WalletContextType, safeData: SafeState): WalletContextType {
  // If it's a custom wallet object, return as-is
  if (typeof preset === 'object' && preset !== null) {
    return preset
  }

  switch (preset) {
    case 'disconnected':
      return disconnectedWallet

    case 'connected':
      // Connected as first owner with default balance
      return createConnectedWallet(safeData, 0)

    case 'owner':
      // Connected as first owner (same as connected, explicit name)
      return createConnectedWallet(safeData, 0, { balance: '12.345' })

    case 'nonOwner':
      // Connected but not an owner of the Safe
      return createNonOwnerWallet(safeData.chainId)

    default:
      console.warn(`Unknown wallet preset: ${preset}, falling back to disconnected`)
      return disconnectedWallet
  }
}
