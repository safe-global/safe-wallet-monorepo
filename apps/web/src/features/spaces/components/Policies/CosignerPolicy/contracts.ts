/**
 * CoSignerPolicy-specific constants. Generic SafePolicyGuard ABIs
 * (setGuard/configureImmediately/requestConfiguration) are shared — see ../shared/guardTx.
 * Addresses come from the policy responses, never hardcoded here.
 *
 * Source: safe-research/policy-engine — contracts/policies/CoSignerPolicy.sol.
 */

/**
 * The `data` field of each `Configuration` is `abi.encode(address cosigner)`:
 *
 *   function configure(address safe, AccessSelector.T access, bytes memory data) external returns (bool) {
 *     address cosigner = abi.decode(data, (address));
 *     $cosigners[msg.sender][safe][access] = cosigner;
 *   }
 *
 * One cosigner per access — configuring an access again replaces its cosigner, and the
 * zero address clears it. Note the contract takes NO threshold: the policy applies to
 * every call matching the access, regardless of amount.
 */
export const COSIGNER_DATA_TYPE = 'address'

/**
 * `checkTransaction` recovers a signature over the Safe transaction hash from the
 * policy `context`, which `SafePolicyGuard._decodeContext` reads off the tail of the
 * `signatures` bytes (`…context‖uint256(context.length)`). Until the wallet appends
 * that, a transaction matching a cosigner access cannot execute — the flow says so
 * before the user signs.
 */
export const COSIGNER_NEEDS_EXECUTION_CONTEXT = true

/** CoSignerPolicy read helper (not used by the write builder). */
export const GET_COSIGNER_ABI = [
  'function getCoSigner(address safe, bytes32 access) view returns (address cosigner)',
] as const
