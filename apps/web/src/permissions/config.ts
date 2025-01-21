import type { RolePermissionsConfig } from './types'
import { Permission, Role } from './types'

const { CreateTransaction, ProposeTransaction, SignTransaction, ExecuteTransaction, EnablePushNotifications } =
  Permission

/**
 * Defines the permissions for each role.
 */
export default <RolePermissionsConfig>{
  [Role.Owner]: () => ({
    [CreateTransaction]: true,
    [ProposeTransaction]: true,
    [SignTransaction]: true,
    [ExecuteTransaction]: () => true,
    [EnablePushNotifications]: true,
  }),
  [Role.Proposer]: () => ({
    [CreateTransaction]: true,
    [ProposeTransaction]: true,
    [ExecuteTransaction]: () => true,
    [EnablePushNotifications]: true,
  }),
  [Role.Executioner]: () => ({
    [ExecuteTransaction]: () => true,
    [EnablePushNotifications]: true,
  }),
  [Role.SpendingLimitBeneficiary]: ({ spendingLimits }) => ({
    [ExecuteTransaction]: () => true,
    [EnablePushNotifications]: true,
  }),
  [Role.NoWalletConnected]: () => ({
    [EnablePushNotifications]: false,
  }),
}
