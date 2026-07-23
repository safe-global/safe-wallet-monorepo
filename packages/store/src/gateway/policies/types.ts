/**
 * Domain vocabulary + wire types for the Spaces policy engine CGW endpoints.
 * The enum string values are the wire-format contract with CGW — do not rename
 * them without a coordinated backend change.
 */

/** Which policy a configured entry is. Discriminator on active policies. */
export enum PolicyType {
  SpendingLimit = 'spending-limit',
  Recovery = 'recovery',
  TokenWithdraw = 'token-withdraw',
  Cosigner = 'cosigner',
}

/**
 * Which kind of guard a policy engine is installed as on the Safe:
 *  - TransactionGuard — checks every Safe transaction (`execTransaction`).
 *  - ModuleGuard      — checks every module execution (`execTransactionFromModule`).
 */
export enum PolicyKind {
  TransactionGuard = 'transaction-guard',
  ModuleGuard = 'module-guard',
}
