import { ContractFactory, NonceManager, parseEther } from 'ethers'
import { createSafe, executeTransaction, proposeTransaction } from './safe.mjs'
import { waitUntil } from './indexing.mjs'
import { erc20Artifact } from './chain.mjs'

export async function prepareHistoryFiltersScenario(env, owners) {
  const context = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
  try {
    const signer = new NonceManager(context.signer)
    await (await signer.sendTransaction({ to: context.safeAddress, value: parseEther('20') })).wait()
    const token = await new ContractFactory(erc20Artifact.abi, erc20Artifact.bytecode, signer).deploy(
      'Isolated decimal token',
      'DEC',
      parseEther('12.087258546746105003'),
      owners.owner4.address,
    )
    await token.waitForDeployment()
    await (await token.transfer(context.safeAddress, parseEther('12.087258546746105003'))).wait()
    const tokenAddress = await token.getAddress()
    await waitUntil(
      env,
      `${env.SAFE_TXS_BASE_URL}/v1/safes/${context.safeAddress}/balances/?trusted=false`,
      (balances) =>
        balances.some(
          (balance) =>
            balance.tokenAddress === tokenAddress && balance.balance === parseEther('12.087258546746105003').toString(),
        ),
    )
    for (let nonce = 0; nonce < 11; nonce++) {
      const proposed = await proposeTransaction(
        context,
        await context.safe.createTransaction({
          transactions: [
            {
              to: owners.owner1.address,
              value: parseEther(nonce === 10 ? '10' : '0.0001').toString(),
              data: '0x',
            },
          ],
        }),
      )
      await executeTransaction(context, proposed.signed, { waitForIndexing: false })
    }
    const receipt = await (
      await context.signer.sendTransaction({ to: context.safeAddress, value: parseEther('0.05') })
    ).wait()
    await waitUntil(env, `${env.SAFE_TXS_BASE_URL}/v1/safes/${context.safeAddress}/incoming-transfers/`, (incoming) =>
      incoming.results.some((transfer) => transfer.transactionHash === receipt.hash),
    )
    await waitUntil(
      env,
      `${context.path}/multisig-transactions/`,
      (history) => history.results.filter((item) => item.transaction.txStatus === 'SUCCESS').length === 11,
    )
    return {
      safes: {
        static: { SEP_STATIC_SAFE_7: `sep:${context.safeAddress}`, SEP_STATIC_SAFE_38: `sep:${context.safeAddress}` },
      },
    }
  } finally {
    context.provider.destroy()
  }
}
