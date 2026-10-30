import { AbiCoder, Interface, keccak256, type Result } from 'ethers'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { Safe__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.5.0/Safe__factory'
import type { PolicyConfiguration, SetupCallDescription } from '../types'

// Hand-written from SafePolicyGuard.sol until the WA-3034 artifact package is published
const CONFIGURATION_TUPLE = 'tuple(address target, bytes4 selector, uint8 operation, address policy, bytes data)'

const policyGuardInterface = new Interface([
  `function configureImmediately(${CONFIGURATION_TUPLE}[] configurations)`,
  'function requestConfiguration(bytes32 configureRoot)',
  `function applyConfiguration(${CONFIGURATION_TUPLE}[] configurations)`,
])

const safeInterface = Safe__factory.createInterface()
const SAFE_SETUP_METHODS = ['setGuard', 'setModuleGuard']

export const describeSetupCall = ({ data }: Pick<MetaTransactionData, 'data'>): SetupCallDescription | undefined => {
  const selector = data.slice(0, 10)
  const guardFunction = policyGuardInterface.getFunction(selector)
  if (guardFunction) return { method: guardFunction.name, target: 'guard' }

  const safeCall = safeInterface.parseTransaction({ data })
  if (!safeCall || !SAFE_SETUP_METHODS.includes(safeCall.name)) return undefined
  return {
    method: safeCall.name,
    target: 'safe',
    param: { name: safeCall.fragment.inputs[0].name, value: String(safeCall.args[0]) },
  }
}

export const createSetGuardTx = (safeAddress: string, guardAddress: string): MetaTransactionData => ({
  to: safeAddress,
  value: '0',
  data: safeInterface.encodeFunctionData('setGuard', [guardAddress]),
})

export const createSetModuleGuardTx = (safeAddress: string, guardAddress: string): MetaTransactionData => ({
  to: safeAddress,
  value: '0',
  data: safeInterface.encodeFunctionData('setModuleGuard', [guardAddress]),
})

// configureImmediately reverts once our guard is in either slot, so it must run before both setters
export const createFirstSetupTxs = ({
  safeAddress,
  guardAddress,
  configurations,
}: {
  safeAddress: string
  guardAddress: string
  configurations: PolicyConfiguration[]
}): MetaTransactionData[] => [
  {
    to: guardAddress,
    value: '0',
    data: policyGuardInterface.encodeFunctionData('configureImmediately', [configurations]),
  },
  createSetGuardTx(safeAddress, guardAddress),
  createSetModuleGuardTx(safeAddress, guardAddress),
]

export const createRequestConfigurationTx = (guardAddress: string, configureRoot: string): MetaTransactionData => ({
  to: guardAddress,
  value: '0',
  data: policyGuardInterface.encodeFunctionData('requestConfiguration', [configureRoot]),
})

export const createApplyConfigurationTx = (
  guardAddress: string,
  configurations: PolicyConfiguration[],
): MetaTransactionData => ({
  to: guardAddress,
  value: '0',
  data: policyGuardInterface.encodeFunctionData('applyConfiguration', [configurations]),
})

export const getConfigurationRoot = (configurations: PolicyConfiguration[]): string =>
  keccak256(AbiCoder.defaultAbiCoder().encode([`${CONFIGURATION_TUPLE}[]`], [configurations]))

const toPolicyConfiguration = (configuration: Result): PolicyConfiguration => {
  const { target, selector, operation, policy, data } = configuration.toObject()
  return { target, selector, operation: Number(operation) === 1 ? 1 : 0, policy, data }
}

/**
 * The configurations a guard call sets, read from its calldata. A request carries only their root, so it returns
 * `requested` only when that hashes to the root.
 */
export const getCallConfigurations = (
  { data }: Pick<MetaTransactionData, 'data'>,
  requested?: PolicyConfiguration[],
): PolicyConfiguration[] | undefined => {
  const fragment = policyGuardInterface.getFunction(data.slice(0, 10))
  if (!fragment) return undefined

  let decoded: Result
  try {
    decoded = policyGuardInterface.decodeFunctionData(fragment, data)
  } catch {
    return undefined
  }

  const [arg] = decoded
  if (fragment.name !== 'requestConfiguration') return Array.from(arg, toPolicyConfiguration)
  return requested && getConfigurationRoot(requested) === String(arg).toLowerCase() ? requested : undefined
}
