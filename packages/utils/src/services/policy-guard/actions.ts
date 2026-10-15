/** `multiSend(bytes)`, the only entry point a Safe batch goes through. */
export const MULTI_SEND_SELECTOR = '0x8d80ff0a'

export const ERC20_TRANSFER_SELECTOR = '0xa9059cbb'
export const ERC20_TRANSFER_FROM_SELECTOR = '0x23b872dd'

/**
 * The calls a Safe makes to itself to change who controls it. The guard keys each one separately,
 * so a policy may permit some and not others.
 */
export const SAFE_MANAGEMENT_SELECTORS: readonly string[] = [
  '0x0d582f13', // addOwnerWithThreshold(address,uint256)
  '0xf8dc5dd9', // removeOwner(address,address,uint256)
  '0xe318b52b', // swapOwner(address,address,address)
  '0x694e80c3', // changeThreshold(uint256)
  '0xe19a9dd9', // setGuard(address)
  '0x610b5925', // enableModule(address)
  '0xe009cfde', // disableModule(address,address)
  '0xe068df37', // setModuleGuard(address)
  '0xf08a0323', // setFallbackHandler(address)
]

const selectorOf = (data: string | undefined): string =>
  data && data.length >= 10 ? data.slice(0, 10).toLowerCase() : '0x'

const sameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/**
 * The calls the guard lets through without consulting a policy, so that policy management is never
 * locked out by the policies themselves: requesting a configuration, applying a matured one, and
 * invalidating a pending root. Each only bypasses the check as a plain zero-value CALL to the guard.
 */
const GUARD_SELF_CALL_SELECTORS: readonly string[] = [
  '0xa809eb8e', // requestConfiguration(bytes32)
  '0xb9ba2798', // applyConfiguration(Configuration[])
  '0x3eefdcce', // invalidateRoot(bytes32)
]

/**
 * Whether a transaction is the Safe managing its own policies.
 *
 * No policy governs these, so there is no verdict to report on them. Anything else aimed at the
 * guard — `configureImmediately`, or any of these carrying value — the guard refuses outright.
 */
export const isGuardSelfCall = (
  tx: { to: string; value: string | bigint; data: string; operation: number },
  guardAddress: string | undefined,
): boolean =>
  !!guardAddress &&
  sameAddress(tx.to, guardAddress) &&
  tx.operation === 0 &&
  BigInt(tx.value) === 0n &&
  GUARD_SELF_CALL_SELECTORS.includes(selectorOf(tx.data))

/** What a checked transaction is doing, as far as the policy engine is concerned. */
export type GuardAction = 'erc20-transfer' | 'native-transfer' | 'multisend' | 'safe-management' | 'other'

const OPERATION_DELEGATECALL = 1

/**
 * Which of the actions the policy engine models a transaction is.
 *
 * Only these can be explained in terms of a policy a user could set up; anything else needs a
 * policy written for it, so it is reported as such rather than guessed at.
 */
export const classifyGuardAction = (
  tx: { to: string; value: string | bigint; data: string; operation: number },
  safeAddress: string,
): GuardAction => {
  const selector = selectorOf(tx.data)

  if (tx.operation === OPERATION_DELEGATECALL) {
    return selector === MULTI_SEND_SELECTOR ? 'multisend' : 'other'
  }

  if (sameAddress(tx.to, safeAddress) && SAFE_MANAGEMENT_SELECTORS.includes(selector)) {
    return 'safe-management'
  }

  if (selector === ERC20_TRANSFER_SELECTOR || selector === ERC20_TRANSFER_FROM_SELECTOR) {
    return 'erc20-transfer'
  }

  // A plain value transfer carries no calldata; the guard keys it by the recipient.
  if (selector === '0x' && BigInt(tx.value) > 0n) return 'native-transfer'

  return 'other'
}
