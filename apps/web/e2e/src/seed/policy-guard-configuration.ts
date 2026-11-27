import { AbiCoder, Interface, ZeroAddress, getAddress, keccak256 } from 'ethers'
import { SAFE_SETTER_SELECTORS } from '@/features/policy-guard/public/services/guardExit'
import { REJECT_SELECTOR } from '@/features/policy-guard/public/services/rejectAccess'
import type { PolicyConfiguration } from '@/features/policy-guard/public/types'

export type TokenAllowlist = { token: string; recipients: string[] }

/** The deployed guard and the policies an allowlist binds */
export type PolicyEngine = { guard: string; erc20TransferPolicy: string; allowPolicy: string }

/** ERC20TransferPolicy's `Permission` enum */
export const RECIPIENT_PERMISSION = { NONE: 0, ONCE: 1, ALWAYS: 2 } as const

export type SetupCall = { to: string; value: string; data: string }

export const ERC20_TRANSFER_SELECTOR = '0xa9059cbb'
const CALL = 0
const CONFIGURATION = 'tuple(address target, bytes4 selector, uint8 operation, address policy, bytes data)'
const guardInterface = new Interface([`function configureImmediately(${CONFIGURATION}[] configurations)`])
const safeInterface = new Interface([
  'function setGuard(address guard)',
  'function setModuleGuard(address moduleGuard)',
])

function tokenRuleOf(
  { token, recipients }: TokenAllowlist,
  { erc20TransferPolicy }: PolicyEngine,
): PolicyConfiguration {
  return {
    target: getAddress(token),
    selector: ERC20_TRANSFER_SELECTOR,
    operation: CALL,
    policy: getAddress(erc20TransferPolicy),
    data: AbiCoder.defaultAbiCoder().encode(
      ['tuple(address recipient, uint8 permission)[]'],
      [recipients.map((recipient) => [getAddress(recipient), RECIPIENT_PERMISSION.ALWAYS])],
    ),
  }
}

/** The configurations of the first setup: the token rule, and the rule that lets the signers reject a transaction */
export function firstSetupConfigurations(
  allowlist: TokenAllowlist,
  safe: string,
  engine: PolicyEngine,
): PolicyConfiguration[] {
  const reject: PolicyConfiguration = {
    target: getAddress(safe),
    selector: REJECT_SELECTOR,
    operation: CALL,
    policy: getAddress(engine.allowPolicy),
    data: '0x',
  }
  return [tokenRuleOf(allowlist, engine), reject]
}

/** The configurations a later change requests: the unbinding of the Safe setters, then the token rule */
export function requestedConfigurations(
  allowlist: TokenAllowlist,
  safe: string,
  engine: PolicyEngine,
): PolicyConfiguration[] {
  const clearedGuardExit = SAFE_SETTER_SELECTORS.map((selector): PolicyConfiguration => ({
    target: getAddress(safe),
    selector,
    operation: CALL,
    policy: ZeroAddress,
    data: '0x',
  }))
  return [...clearedGuardExit, tokenRuleOf(allowlist, engine)]
}

/** The root that `requestConfiguration` takes for the allowlist on `safe`: the hash `applyConfiguration` checks. */
export function configurationRootOf(allowlist: TokenAllowlist, safe: string, engine: PolicyEngine): string {
  return keccak256(
    AbiCoder.defaultAbiCoder().encode([`${CONFIGURATION}[]`], [requestedConfigurations(allowlist, safe, engine)]),
  )
}

/** The calls of the first setup: `configureImmediately`, then both guard slots */
export function firstSetupCalls(allowlist: TokenAllowlist, safe: string, engine: PolicyEngine): SetupCall[] {
  const guard = getAddress(engine.guard)
  const safeAddress = getAddress(safe)
  return [
    {
      to: guard,
      value: '0',
      data: guardInterface.encodeFunctionData('configureImmediately', [
        firstSetupConfigurations(allowlist, safe, engine),
      ]),
    },
    { to: safeAddress, value: '0', data: safeInterface.encodeFunctionData('setGuard', [guard]) },
    { to: safeAddress, value: '0', data: safeInterface.encodeFunctionData('setModuleGuard', [guard]) },
  ]
}
