import { Interface, ZeroAddress } from 'ethers'
import { getAllowanceModuleDeployment } from '@safe-global/safe-modules-deployments'
import { SEPOLIA } from './chain.mjs'
import { registerContract } from './contracts.mjs'

const deployment = getAllowanceModuleDeployment({ version: '0.1.0' })
export const ALLOWANCE_MODULE = deployment.networkAddresses[SEPOLIA]
export const allowanceModuleAbi = deployment.abi
const allowanceInterface = new Interface(deployment.abi)
const safeInterface = new Interface(['function enableModule(address)'])

export const allowanceCall = (method, args) => ({
  to: ALLOWANCE_MODULE,
  data: allowanceInterface.encodeFunctionData(method, args),
})

/** Calls that enable the module on `safeAddress` and give each delegate a native-token allowance, in order. */
export function allowanceSetupCalls(safeAddress, allowances) {
  return [
    { to: safeAddress, data: safeInterface.encodeFunctionData('enableModule', [ALLOWANCE_MODULE]) },
    ...allowances.flatMap(({ delegate, amount }) => [
      allowanceCall('addDelegate', [delegate]),
      allowanceCall('setAllowance', [delegate, ZeroAddress, amount, 0, 0]),
    ]),
  ]
}

/** The decoder needs the module ABI, so CGW shows module calls as on staging. */
export function registerAllowanceModule(env) {
  return registerContract(env, {
    address: ALLOWANCE_MODULE,
    chainId: SEPOLIA,
    name: 'AllowanceModule',
    abi: deployment.abi,
  })
}
