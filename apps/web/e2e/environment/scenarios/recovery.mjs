import { createRequire } from 'node:module'
import { registerContract } from './contracts.mjs'
import { createSafe, createSafeAddress, executeTransaction, proposeTransaction } from './safe.mjs'
import { rebuildStagingSafes } from './staging-safes.mjs'
import { waitUntil } from './indexing.mjs'
import { short } from './chain.mjs'

const { deployAndSetUpModule, getModuleInstance, KnownContracts } = createRequire(import.meta.url)('@gnosis.pm/zodiac')

// SEP_RECOVERY_SAFE_4 on staging: a Delay modifier with a 56-day cooldown, no expiry and OWNER_2 as recoverer.
const COOLDOWN = 56 * 24 * 60 * 60

async function enableRecovery(env, context, recoverer) {
  const { transaction: deployment, expectedModuleAddress } = await deployAndSetUpModule(
    KnownContracts.DELAY,
    {
      types: ['address', 'address', 'address', 'uint256', 'uint256'],
      values: [context.safeAddress, context.safeAddress, context.safeAddress, COOLDOWN, 0],
    },
    context.provider,
    Number(context.chainId),
    Date.now().toString(),
  )
  if ((await context.provider.getCode(deployment.to)) === '0x')
    throw new Error('Zodiac factory is missing from the fork')
  const module = getModuleInstance(KnownContracts.DELAY, expectedModuleAddress, context.provider)
  const enable = await context.safe.createEnableModuleTx(expectedModuleAddress)
  const transaction = await context.safe.createTransaction({
    transactions: [
      { ...deployment, value: deployment.value.toString() },
      { to: enable.data.to, value: enable.data.value, data: enable.data.data },
      { to: expectedModuleAddress, value: '0', data: module.interface.encodeFunctionData('enableModule', [recoverer]) },
    ],
  })
  await executeTransaction(context, (await proposeTransaction(context, transaction)).signed)
  await waitUntil(env, context.path, (safe) => safe.modules?.some(({ value }) => value === expectedModuleAddress))
  if (!(await module.isModuleEnabled(recoverer)) || (await module.txCooldown()) !== BigInt(COOLDOWN)) {
    throw new Error('Recovery module does not match the staging setup')
  }
  await registerContract(env, {
    address: expectedModuleAddress,
    chainId: context.chainId,
    name: 'Delay Modifier',
    abi: JSON.parse(module.interface.formatJson()),
  })
}

export async function prepareRecoveryScenario(env, owners) {
  const recovery = await createSafe(env, owners, {
    ownerAddresses: [owners.owner3.address, owners.owner4.address],
    threshold: 1,
  })
  try {
    await enableRecovery(env, recovery, owners.owner2.address)
  } finally {
    recovery.provider.destroy()
  }
  const plain = await createSafeAddress(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
  return {
    safes: {
      recovery: {
        SEP_RECOVERY_SAFE_1: `sep:${plain}`,
        SEP_RECOVERY_SAFE_4: `sep:${recovery.safeAddress}`,
      },
      static: await rebuildStagingSafes(env, owners, ['SEP_STATIC_SAFE_13']),
    },
    fixtures: { 'recovery.recoverer': short(owners.owner2.address) },
  }
}
