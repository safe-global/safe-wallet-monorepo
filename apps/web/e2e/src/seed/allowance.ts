import { parseEther } from 'ethers'
import { ALLOWANCE_MODULE, allowanceSetupCalls } from '../../environment/scenarios/allowance.mjs'
import { waitUntil } from '../../environment/scenarios/indexing.mjs'
import { executeTransaction } from '../../environment/scenarios/safe.mjs'
import { readChain } from '../chain/local-provider'
import type { SafeInfo } from '../types/safe.types'
import type { SeededSafe } from './safe'

/** Enables the AllowanceModule and gives `delegate` an `amount` ETH allowance in one Safe transaction. */
export async function seedAllowance(
  safe: SeededSafe,
  { delegate, amount }: { delegate: string; amount: string },
): Promise<void> {
  const { context } = safe
  const calls = allowanceSetupCalls(safe.address, [{ delegate, amount: parseEther(amount) }])
  const setup = await context.safe.createTransaction({
    transactions: calls.map(({ to, data }) => ({ to, value: '0', data })),
  })
  await readChain(context.env, (provider) => executeTransaction({ ...context, provider }, setup))
  await waitUntil(context.env, context.path, (info: SafeInfo) =>
    info.modules.some(({ value }) => value === ALLOWANCE_MODULE),
  )
}
