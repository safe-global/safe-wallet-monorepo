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

/**
 * The `data` field of each `Configuration` is `abi.encode(RecipientData[])`.
 * `ERC20TransferPolicy.configure` decodes it as this tuple array:
 *   struct RecipientData { address recipient; bool allowed; }  // allowed:false removes
 * This is the ethers encode-type descriptor for that struct array.
 */
export const RECIPIENT_DATA_TYPE = 'tuple(address recipient, bool allowed)[]'

/** ERC20TransferPolicy read helper (for reading back the allowlist; not used by the write builder). */
export const IS_RECIPIENT_ALLOWED_ABI = [
  'function isRecipientAllowed(address policyGuard, address safe, address token, address recipient) view returns (bool)',
] as const
