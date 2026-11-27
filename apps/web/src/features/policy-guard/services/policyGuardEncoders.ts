import { AbiCoder, Interface, keccak256 } from 'ethers'
import type { MetaTransactionData } from '@safe-global/types-kit'
import type { PolicyConfiguration } from '../types'

// Hand-written from SafePolicyGuard.sol until the WA-3034 artifact package is published
const CONFIGURATION_TUPLE = 'tuple(address target, bytes4 selector, uint8 operation, address policy, bytes data)'

const policyGuardInterface = new Interface([
  `function configureImmediately(${CONFIGURATION_TUPLE}[] configurations)`,
  'function requestConfiguration(bytes32 configureRoot)',
  `function applyConfiguration(${CONFIGURATION_TUPLE}[] configurations)`,
])

const safeGuardManagerInterface = new Interface([
  'function setGuard(address guard)',
  'function setModuleGuard(address moduleGuard)',
])

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
  {
    to: safeAddress,
    value: '0',
    data: safeGuardManagerInterface.encodeFunctionData('setGuard', [guardAddress]),
  },
  {
    to: safeAddress,
    value: '0',
    data: safeGuardManagerInterface.encodeFunctionData('setModuleGuard', [guardAddress]),
  },
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
