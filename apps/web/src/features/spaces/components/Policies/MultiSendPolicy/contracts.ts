/**
 * MultiSendPolicy-specific constants.
 *
 * The policy takes no payload. Its `configure` accepts the access only when it is the
 * `multiSend` selector on a DELEGATECALL:
 *
 *   function configure(address, AccessSelector.T access, bytes memory) external pure returns (bool) {
 *     return access.getSelector() == IMultiSend.multiSend.selector && access.getOperation() == Operation.DELEGATECALL;
 *   }
 *
 * Source: safe-research/policy-engine — contracts/policies/MultiSendPolicy.sol.
 */

/** `multiSend(bytes)` — the only selector the policy may be bound to. */
export const MULTI_SEND_SELECTOR = '0x8d80ff0a'

/** MultiSendPolicy reads no `data`. */
export const MULTI_SEND_POLICY_DATA = '0x'
