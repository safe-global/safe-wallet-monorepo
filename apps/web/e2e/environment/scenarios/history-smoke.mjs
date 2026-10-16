import { readFile } from 'node:fs/promises'
import { ContractFactory, NonceManager } from 'ethers'
import { createSafe } from './safe.mjs'
import { trustToken } from './tokens.mjs'
import { waitUntil } from './indexing.mjs'
import { erc20Artifact, send } from './chain.mjs'

export async function prepareHistorySmokeScenario(env, owners) {
  const history = JSON.parse(
    await readFile(new URL('../../../cypress/fixtures/history/history_tx_1.json', import.meta.url), 'utf8'),
  )
  const row = history.results.find((item) => item.transaction?.txInfo?.transferInfo?.tokenSymbol === 'QTRUST')
  if (!row) throw new Error('history/history_tx_1.json has no QTRUST transfer to replay')
  const { sender, transferInfo } = row.transaction.txInfo
  const context = await createSafe(env, owners)
  try {
    const token = await new ContractFactory(
      erc20Artifact.abi,
      erc20Artifact.bytecode,
      new NonceManager(context.signer),
    ).deploy(transferInfo.tokenName, transferInfo.tokenSymbol, transferInfo.value, sender.value)
    await token.waitForDeployment()
    const { hash } = await send(context.provider, sender.value, {
      to: token.target,
      data: token.interface.encodeFunctionData('transfer', [context.safeAddress, transferInfo.value]),
    })
    await waitUntil(
      env,
      `${env.SAFE_TXS_BASE_URL}/v1/safes/${context.safeAddress}/balances/?trusted=false`,
      (balances) =>
        balances.some((balance) => balance.tokenAddress === token.target && balance.balance === transferInfo.value),
    )
    await trustToken(env, await token.getAddress())
    let incoming
    await waitUntil(env, `${context.path}/transactions/history`, (result) => {
      incoming = result.results.find((item) => item.transaction?.txHash === hash)?.transaction
      return incoming?.txInfo?.transferInfo?.tokenSymbol === transferInfo.tokenSymbol
    })
    await waitUntil(
      env,
      `${env.SAFE_CGW_BASE_URL}/v1/chains/${context.chainId}/transactions/${incoming.id}`,
      (detail) => detail.txHash === hash && detail.txInfo.sender.value === sender.value,
    )
    row.transaction = incoming
    return {
      safes: { static: { SEP_STATIC_SAFE_23: `sep:${context.safeAddress}` } },
      files: { 'history/history_tx_1.json': history },
    }
  } finally {
    context.provider.destroy()
  }
}
