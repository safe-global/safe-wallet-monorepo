import { Permission, Role, RolePermissionsConfig } from './types'

const { CreateTransaction, ProposeTransaction, SignTransaction, ExecuteTransaction } = Permission

/**
 * Defines the permissions for each role.
 */
export default <RolePermissionsConfig>{
  [Role.Owner]: () => ({
    [CreateTransaction]: true,
    [ProposeTransaction]: true,
    [SignTransaction]: true,
    [ExecuteTransaction]: ({ safeTx }) => safeTx.data.nonce === 123,
  }),
  [Role.Proposer]: ({ spendingLimits }) => ({
    [CreateTransaction]: true,
    [ProposeTransaction]: !!spendingLimits,
    [ExecuteTransaction]: ({ safeTx }) => !!safeTx,
  }),
  [Role.Executioner]: () => ({
    [ExecuteTransaction]: ({ safeTx }) => safeTx.data.nonce === 111,
  }),
  [Role.SpendingLimitBeneficiary]: ({ spendingLimits }) => ({
    [ExecuteTransaction]: ({ safeTx }) => !!spendingLimits && safeTx.data.nonce === 123,
  }),
}
