import { OperationType } from '@safe-global/safe-core-sdk-types'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { getModuleInstance, KnownContracts, deployAndSetUpModule } from '@gnosis.pm/zodiac'
import { Interface } from 'ethers'
import type { JsonRpcProvider } from 'ethers'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types'

import { sameAddress } from '@safe-global/utils/utils/addresses'
import { MAX_RECOVERER_PAGE_SIZE } from './recovery-state'
import type { UpsertRecoveryFlowProps } from '@/components/tx-flow/flows/UpsertRecovery'

export async function _getRecoverySetupTransactions({
  delay,
  expiry,
  recoverers,
  chainId,
  safeAddress,
  provider,
}: {
  delay: string
  expiry: string
  recoverers: Array<string>
  chainId: string
  safeAddress: string
  provider: JsonRpcProvider
}): Promise<{ expectedModuleAddress: string; transactions: Array<MetaTransactionData> }> {
  const setupArgs: Parameters<typeof deployAndSetUpModule>[1] = {
    types: ['address', 'address', 'address', 'uint256', 'uint256'],
    values: [
      safeAddress, // address _owner
      safeAddress, // address _avatar
      safeAddress, // address _target
      delay, // uint256 _cooldown
      expiry, // uint256 _expiration
    ],
  }

  const saltNonce: Parameters<typeof deployAndSetUpModule>[4] = Date.now().toString()

  const { transaction, expectedModuleAddress } = await deployAndSetUpModule(
    KnownContracts.DELAY,
    setupArgs,
    provider,
    Number(chainId),
    saltNonce,
  )

  const transactions: Array<MetaTransactionData> = []

  // Deploy Delay Modifier
  const deployDeplayModifier: MetaTransactionData = {
    ...transaction,
    value: transaction.value.toString(),
  }

  transactions.push(deployDeplayModifier)

  const safeAbi = ['function enableModule(address module)']
  const safeInterface = new Interface(safeAbi)

  // Enable Delay Modifier on Safe
  const enableDelayModifier: MetaTransactionData = {
    to: safeAddress,
    value: '0',
    data: safeInterface.encodeFunctionData('enableModule', [expectedModuleAddress]),
  }

  transactions.push(enableDelayModifier)

  const delayModifierContract = getModuleInstance(KnownContracts.DELAY, expectedModuleAddress, provider)

  // Add recoverers to Delay Modifier
  const enableDelayModifierModules: Array<MetaTransactionData> = recoverers.map((recoverer) => {
    return {
      to: expectedModuleAddress,
      data: delayModifierContract.interface.encodeFunctionData('enableModule', [recoverer]),
      value: '0',
    }
  })

  transactions.push(...enableDelayModifierModules)

  return {
    expectedModuleAddress,
    transactions,
  }
}

export async function _getEditRecoveryTransactions({
  newDelay,
  newExpiry,
  newRecoverers,
  moduleAddress,
  provider,
}: {
  newDelay: string
  newExpiry: string
  newRecoverers: Array<string>
  moduleAddress: string
  provider: JsonRpcProvider
}): Promise<Array<MetaTransactionData>> {
  const delayModifierContract = getModuleInstance(KnownContracts.DELAY, moduleAddress, provider)

  const [oldExpiry, oldDelay, [recoverers]] = await Promise.all([
    delayModifierContract.txExpiration(),
    delayModifierContract.txCooldown(),
    delayModifierContract.getModulesPaginated(SENTINEL_ADDRESS, MAX_RECOVERER_PAGE_SIZE),
  ])

  // Recovery management transaction data
  const txData: Array<string> = []

  // Update cooldown
  if (oldDelay !== BigInt(newDelay)) {
    const setTxCooldown = delayModifierContract.interface.encodeFunctionData('setTxCooldown', [newDelay])
    txData.push(setTxCooldown)
  }

  // Update expiration
  if (oldExpiry !== BigInt(newExpiry)) {
    const setTxExpiration = delayModifierContract.interface.encodeFunctionData('setTxExpiration', [newExpiry])
    txData.push(setTxExpiration)
  }

  // Cache recoverer changes to determine prevModule
  let _recoverers = [...recoverers]

  // Don't add/remove same owners
  const recoverersToAdd = newRecoverers.filter(
    (newRecoverer) => !_recoverers.some((oldRecoverer) => sameAddress(oldRecoverer, newRecoverer)),
  )
  const recoverersToRemove = _recoverers.filter(
    (oldRecoverer) => !newRecoverers.some((newRecoverer) => sameAddress(newRecoverer, oldRecoverer)),
  )

  for (const recovererToRemove of recoverersToRemove) {
    const prevModule = (() => {
      const recovererIndex = _recoverers.findIndex((recoverer) => sameAddress(recoverer, recovererToRemove))
      return recovererIndex === 0 ? SENTINEL_ADDRESS : _recoverers[recovererIndex - 1]
    })()
    const disableModule = delayModifierContract.interface.encodeFunctionData('disableModule', [
      prevModule,
      recovererToRemove,
    ])
    txData.push(disableModule)

    // Remove recoverer from cache
    _recoverers = _recoverers.filter((recoverer) => !sameAddress(recoverer, recovererToRemove))
  }

  for (const recovererToAdd of recoverersToAdd) {
    const enableModule = delayModifierContract.interface.encodeFunctionData('enableModule', [recovererToAdd])
    txData.push(enableModule)

    // Need not add recoverer to cache as not relevant for prevModule
  }

  return txData.map((data) => ({
    to: moduleAddress,
    value: '0',
    operation: OperationType.Call,
    data,
  }))
}

export async function getRecoveryUpsertTransactions({
  delay,
  expiry,
  recoverer,
  provider,
  moduleAddress,
  chainId,
  safeAddress,
}: UpsertRecoveryFlowProps & {
  moduleAddress?: string
  provider: JsonRpcProvider
  chainId: string
  safeAddress: string
}): Promise<Array<MetaTransactionData>> {
  if (moduleAddress) {
    return _getEditRecoveryTransactions({
      moduleAddress,
      newDelay: delay,
      newExpiry: expiry,
      newRecoverers: [recoverer],
      provider,
    })
  }

  const { transactions } = await _getRecoverySetupTransactions({
    delay,
    expiry,
    recoverers: [recoverer],
    chainId,
    safeAddress,
    provider,
  })

  return transactions
}
