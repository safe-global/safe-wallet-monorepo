import type { RolePermissionsConfig } from './types'
import { Permission, Role } from './types'

const { CreateTransaction, ProposeTransaction, SignTransaction, ExecuteTransaction } = Permission

/**
 * Defines the permissions for each role.
 */
export default <RolePermissionsConfig>{
  [Role.Owner]: () => ({
    [CreateTransaction]: true,
    [ProposeTransaction]: true,
    [SignTransaction]: true,
    [ExecuteTransaction]: ({ safeTx }) => safeTx.data.nonce === 123, // TODO: implement correct logic
  }),
  [Role.Proposer]: () => ({
    [CreateTransaction]: true,
    [ProposeTransaction]: true,
    [ExecuteTransaction]: ({ safeTx }) => !!safeTx, // TODO: implement correct logic
  }),
  [Role.Executioner]: () => ({
    [ExecuteTransaction]: ({ safeTx }) => safeTx.data.nonce === 111, // TODO: implement correct logic
  }),
  [Role.SpendingLimitBeneficiary]: ({ spendingLimits }) => ({
    [ExecuteTransaction]: ({ safeTx }) => !!spendingLimits && safeTx.data.nonce === 123, // TODO: implement correct logic
  }),
}
