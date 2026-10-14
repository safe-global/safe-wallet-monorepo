/**
 * The Safe's own management functions, which a policy can govern one by one.
 *
 * Each is a call the Safe makes *to itself*, so the access is `(safe, selector, CALL)`.
 * There is no dedicated contract for this: the policy bound to each selected access is
 * AllowPolicy, which permits the call and takes no payload. Selecting a subset therefore
 * means "these management functions stay permitted"; anything left unselected falls
 * through to the Safe's fallback policy, which is what makes the choice meaningful — pair
 * it with a Deny fallback to lock the rest down.
 *
 * Selectors verified against safe-smart-account v1.4.1.
 */
export type SafeManagementFunction = {
  id: string
  /** The managing contract, for grouping in the UI. */
  contract: 'OwnerManager' | 'GuardManager' | 'ModuleManager' | 'FallbackManager'
  signature: string
  selector: string
  label: string
  description: string
}

export const SAFE_MANAGEMENT_FUNCTIONS: SafeManagementFunction[] = [
  {
    id: 'addOwnerWithThreshold',
    contract: 'OwnerManager',
    signature: 'addOwnerWithThreshold(address,uint256)',
    selector: '0x0d582f13',
    label: 'Add a signer',
    description: 'Adds an owner and sets the signature threshold.',
  },
  {
    id: 'removeOwner',
    contract: 'OwnerManager',
    signature: 'removeOwner(address,address,uint256)',
    selector: '0xf8dc5dd9',
    label: 'Remove a signer',
    description: 'Removes an owner and sets the signature threshold.',
  },
  {
    id: 'swapOwner',
    contract: 'OwnerManager',
    signature: 'swapOwner(address,address,address)',
    selector: '0xe318b52b',
    label: 'Replace a signer',
    description: 'Swaps one owner for another, leaving the threshold untouched.',
  },
  {
    id: 'changeThreshold',
    contract: 'OwnerManager',
    signature: 'changeThreshold(uint256)',
    selector: '0x694e80c3',
    label: 'Change the threshold',
    description: 'Changes how many signatures a transaction needs.',
  },
  {
    id: 'setGuard',
    contract: 'GuardManager',
    signature: 'setGuard(address)',
    selector: '0xe19a9dd9',
    label: 'Change the transaction guard',
    description: 'Replaces the transaction guard — including the policy guard itself.',
  },
  {
    id: 'enableModule',
    contract: 'ModuleManager',
    signature: 'enableModule(address)',
    selector: '0x610b5925',
    label: 'Enable a module',
    description: 'Grants a module the ability to execute transactions.',
  },
  {
    id: 'disableModule',
    contract: 'ModuleManager',
    signature: 'disableModule(address,address)',
    selector: '0xe009cfde',
    label: 'Disable a module',
    description: 'Revokes a module.',
  },
  {
    id: 'setModuleGuard',
    contract: 'ModuleManager',
    signature: 'setModuleGuard(address)',
    selector: '0xe068df37',
    label: 'Change the module guard',
    description: 'Replaces the guard that checks module executions.',
  },
  {
    id: 'setFallbackHandler',
    contract: 'FallbackManager',
    signature: 'setFallbackHandler(address)',
    selector: '0xf08a0323',
    label: 'Change the fallback handler',
    description: 'Replaces the contract handling calls the Safe has no function for.',
  },
]

export const SAFE_MANAGEMENT_SELECTORS: string[] = SAFE_MANAGEMENT_FUNCTIONS.map((fn) => fn.selector)

export const safeManagementFunctionBySelector = (selector: string): SafeManagementFunction | undefined =>
  SAFE_MANAGEMENT_FUNCTIONS.find((fn) => fn.selector.toLowerCase() === selector.toLowerCase())

/**
 * `setGuard` governs the policy guard itself. Leaving it unselected against a Deny fallback
 * makes the guard unremovable, so the wizard warns before it is left out.
 */
export const GUARD_CRITICAL_FUNCTION_IDS = ['setGuard', 'setModuleGuard']

/** AllowPolicy reads no `data`. */
export const SAFE_MANAGEMENT_POLICY_DATA = '0x'
