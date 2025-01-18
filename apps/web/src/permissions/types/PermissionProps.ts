import { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { Permission } from './Permission'

/**
 * PermissionPropsMap defines property types for specific permissions.
 * The props are used as inputs to evaluate permission functions.
 */
export type PermissionPropsMap = {
  [Permission.ExecuteTransaction]: { safeTx: SafeTransaction }
}

// Extract the props for a specific permission from PermissionPropsMap
export type PermissionProps<P extends Permission> = P extends keyof PermissionPropsMap
  ? PermissionPropsMap[P]
  : undefined
