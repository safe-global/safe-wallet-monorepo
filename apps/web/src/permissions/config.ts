import type { RolePermissionsConfig } from './types'
import { Permission, Role } from './types'

const {
  CreateTransaction,
  ProposeTransaction,
  SignTransaction,
  ExecuteTransaction,
  EnablePushNotifications,
  CreateSpendingLimitTransaction,
} = Permission

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
    [CreateSpendingLimitTransaction]: ({ token } = {}) => {
      if (!token) return false

      const spendingLimit = spendingLimits.find((sl) => sl.token.address === token.address)

      if (spendingLimit) {
        return BigInt(spendingLimit.amount) - BigInt(spendingLimit.spent) > 0
      }

      return false
    },
  }),
  [Role.NoWalletConnected]: () => ({
    [EnablePushNotifications]: false,
  }),
}
