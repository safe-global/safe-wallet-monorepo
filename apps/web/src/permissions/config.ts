import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'

export enum Role {
  Owner = 'Owner',
  NestedOwner = 'NestedOwner',
  Proposer = 'Proposer',
  Executioner = 'Executioner',
  ModuleRole = 'ModuleRole',
  Recoverer = 'Recoverer',
  SpendingLimitBeneficiary = 'SpendingLimitBeneficiary',
  NoWalletConnected = 'NoWalletConnected',
}

export enum Permission {
  CreateTransaction = 'CreateTransaction',
  ProposeTransaction = 'ProposeTransaction',
  SignTransaction = 'SignTransaction',
  ExecuteTransaction = 'ExecuteTransaction',
  CreateSpendingLimitTransaction = 'CreateSpendingLimitTransaction',
  EnablePushNotifications = 'EnablePushNotifications',
}

/**
 * RolePropsMap defines property types for specific roles.
 * The props are used to specify conditional permission values for the respective role.
 */
export type RolePropsMap = {
  [Role.SpendingLimitBeneficiary]: {
    spendingLimits: SpendingLimitState[]
  }
}

// Extract the props for a specific role from RolePropsMap
export type RoleProps<R extends Role> = R extends keyof RolePropsMap ? RolePropsMap[R] : undefined

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

// Define the type for a permission function that evaluates to a boolean
type PermissionFn<P extends Permission> =
  PermissionProps<P> extends undefined ? undefined : (args: PermissionProps<P>) => boolean

// Define the type for a permission set that maps permissions to their values
export type PermissionSet = {
  [P in Permission]?: PermissionFn<P> extends undefined ? boolean : PermissionFn<P>
}

export type RolePermissionsFn<R extends Role> =
  RoleProps<R> extends undefined ? () => PermissionSet : (props: RoleProps<R>) => PermissionSet

type RolePermissionsConfig = {
  [R in Role]?: RolePermissionsFn<R>
}

/**
 * Defines the permissions for each role.
 */
export default <RolePermissionsConfig>{
  [Role.Owner]: () => ({
    [Permission.CreateTransaction]: true,
    [Permission.ProposeTransaction]: true,
    [Permission.SignTransaction]: true,
    [Permission.ExecuteTransaction]: () => true,
    [Permission.EnablePushNotifications]: true,
  }),
  [Role.Proposer]: () => ({
    [Permission.CreateTransaction]: true,
    [Permission.ProposeTransaction]: true,
    [Permission.ExecuteTransaction]: () => true,
    [Permission.EnablePushNotifications]: true,
  }),
  [Role.Executioner]: () => ({
    [Permission.ExecuteTransaction]: () => true,
    [Permission.EnablePushNotifications]: true,
  }),
  [Role.SpendingLimitBeneficiary]: ({ spendingLimits }) => ({
    [Permission.ExecuteTransaction]: () => true,
    [Permission.EnablePushNotifications]: true,
    [Permission.CreateSpendingLimitTransaction]: ({ token } = {}) => {
      if (!token) return false

      const spendingLimit = spendingLimits.find((sl) => sl.token.address === token.address)

      if (spendingLimit) {
        return BigInt(spendingLimit.amount) - BigInt(spendingLimit.spent) > 0
      }

      return false
    },
  }),
  [Role.NoWalletConnected]: () => ({
    [Permission.EnablePushNotifications]: false,
  }),
}
