import { Contract, ZeroAddress, parseEther } from 'ethers'
import { ALLOWANCE_MODULE, allowanceModuleAbi, allowanceSetupCalls } from './allowance.mjs'
import { createSafe, executeTransaction, proposeTransaction } from './safe.mjs'
import { waitForQueued, waitUntil } from './indexing.mjs'

export async function prepareReplacementScenario(env, owners) {
  const queue = await createSafe(env, owners)
  let allowance
  try {
    const transfer = [{ to: owners.owner1.address, value: parseEther('0.001').toString(), data: '0x' }]
    const queued = await proposeTransaction(
      queue,
      await queue.safe.createTransaction({ transactions: transfer, options: { nonce: 0 } }),
    )
    await waitForQueued(env, queue, [queued.hash])
    allowance = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
    const delegate = owners.owner4.address
    const limit = allowanceSetupCalls(allowance.safeAddress, [{ delegate, amount: parseEther('0.1') }])
    await executeTransaction(
      allowance,
      await allowance.safe.createTransaction({ transactions: limit.map(({ to, data }) => ({ to, value: '0', data })) }),
    )
    const module = new Contract(ALLOWANCE_MODULE, allowanceModuleAbi, allowance.provider)
    const [amount] = await module.getTokenAllowance(allowance.safeAddress, delegate, ZeroAddress)
    if (amount !== parseEther('0.1')) throw new Error('Spending allowance was not configured')
    await waitUntil(env, allowance.path, (safe) => safe.modules.some(({ value }) => value === ALLOWANCE_MODULE))
    const withAllowance = await proposeTransaction(
      allowance,
      await allowance.safe.createTransaction({ transactions: transfer, options: { nonce: 1 } }),
    )
    await waitForQueued(env, allowance, [withAllowance.hash])
    return {
      safes: {
        static: { SEP_STATIC_SAFE_34: `sep:${queue.safeAddress}`, SEP_STATIC_SAFE_7: `sep:${allowance.safeAddress}` },
      },
      fixtures: { 'swaps.sellQLimitOrder': queued.id, 'replacement.withAllowance': withAllowance.id },
    }
  } finally {
    queue.provider.destroy()
    allowance?.provider.destroy()
  }
}
