import { createRequire } from 'node:module'
import { registerContract } from './contracts.mjs'
import { executeTransaction, proposeTransaction } from './safe.mjs'
import { waitUntil } from './indexing.mjs'

const { deployAndSetUpModule, getModuleInstance, KnownContracts } = createRequire(import.meta.url)('@gnosis.pm/zodiac')

// The longest review window the app offers.
const COOLDOWN = 56 * 24 * 60 * 60

/** Deploys a Delay modifier with `recoverer` on the Safe of `context` and returns the modifier's address. */
export async function enableRecovery(env, context, recoverer, { cooldown = COOLDOWN } = {}) {
  const { transaction: deployment, expectedModuleAddress } = await deployAndSetUpModule(
    KnownContracts.DELAY,
    {
      types: ['address', 'address', 'address', 'uint256', 'uint256'],
      values: [context.safeAddress, context.safeAddress, context.safeAddress, cooldown, 0],
    },
    context.provider,
    Number(context.chainId),
    Date.now().toString(),
  )
  if ((await context.provider.getCode(deployment.to)) === '0x')
    throw new Error('Zodiac factory is missing from the fork')
  const delayModifier = getModuleInstance(KnownContracts.DELAY, expectedModuleAddress, context.provider)
  const enable = await context.safe.createEnableModuleTx(expectedModuleAddress)
  const transaction = await context.safe.createTransaction({
    transactions: [
      { ...deployment, value: deployment.value.toString() },
      { to: enable.data.to, value: enable.data.value, data: enable.data.data },
      {
        to: expectedModuleAddress,
        value: '0',
        data: delayModifier.interface.encodeFunctionData('enableModule', [recoverer]),
      },
    ],
  })
  await executeTransaction(context, (await proposeTransaction(context, transaction)).signed)
  await waitUntil(env, context.path, (safe) => safe.modules?.some(({ value }) => value === expectedModuleAddress))
  if (!(await delayModifier.isModuleEnabled(recoverer)) || (await delayModifier.txCooldown()) !== BigInt(cooldown)) {
    throw new Error('Recovery module does not match the requested setup')
  }
  await registerContract(env, {
    address: expectedModuleAddress,
    chainId: context.chainId,
    name: 'Delay Modifier',
    abi: JSON.parse(delayModifier.interface.formatJson()),
  })
  return expectedModuleAddress
}
