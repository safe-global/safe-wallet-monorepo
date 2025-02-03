import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { Permission } from './Permission'
import type { TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'

/**
 * PermissionPropsMap defines property types for specific permissions.
 * The props are used as inputs to evaluate permission functions.
 */
export type PermissionPropsMap = {
  [Permission.ExecuteTransaction]: { safeTx: SafeTransaction }
  [Permission.CreateSpendingLimitTransaction]: { token?: TokenInfo } | undefined
}

// Extract the props for a specific permission from PermissionPropsMap
export type PermissionProps<P extends Permission> = P extends keyof PermissionPropsMap
  ? PermissionPropsMap[P]
  : undefined
