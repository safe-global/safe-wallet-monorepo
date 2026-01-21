/**
 * Feature Handles Registry
 *
 * This file imports all feature handles and exports them as an array.
 * These handles are passed to FeatureRegistryProvider at app startup.
 *
 * IMPORTANT: Only import HANDLES here, not full feature implementations.
 * Handles are tiny (~100 bytes each) and contain only:
 * - name
 * - useIsEnabled (flag check)
 * - load() function (lazy loader)
 *
 * The full feature code is only loaded when the feature is enabled AND accessed.
 */
import { walletConnectHandle } from '@/features/walletconnect/handle'

export const featureHandles = [walletConnectHandle]
