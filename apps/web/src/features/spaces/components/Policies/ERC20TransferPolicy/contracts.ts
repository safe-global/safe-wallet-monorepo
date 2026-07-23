/**
 * ERC20TransferPolicy-specific constants (the on-chain policy that enforces the
 * token-withdraw allowlist). Generic SafePolicyGuard ABIs
 * (setGuard/configureImmediately/OPERATION_CALL) are shared — see
 * ../shared/guardTx. Addresses come from the policy responses (§5.3), never
 * hardcoded here.
 *
 * Source: safe-research/policy-engine (ERC20TransferPolicy.sol).
 */

/** ERC20 transfer selectors the token-withdraw policy restricts. */
export const ERC20_TRANSFER_SELECTOR = '0xa9059cbb' // transfer(address,uint256)
export const ERC20_TRANSFER_FROM_SELECTOR = '0x23b872dd' // transferFrom(address,address,uint256)

/** ERC20TransferPolicy read helper (for reading back the allowlist; not used by the write builder). */
export const IS_RECIPIENT_ALLOWED_ABI = [
  'function isRecipientAllowed(address policyGuard, address safe, address token, address recipient) view returns (bool)',
] as const
