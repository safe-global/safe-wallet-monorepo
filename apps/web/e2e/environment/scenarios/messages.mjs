import { readFile } from 'node:fs/promises'
import { isDeepStrictEqual } from 'node:util'
import Safe from '@safe-global/protocol-kit'
import { Interface, toUtf8Bytes } from 'ethers'
import { getSignMessageLibDeployment } from '@safe-global/safe-deployments'
import { createSafe, executeTransaction, proposeTransaction } from './safe.mjs'
import { waitForQueued, waitUntil } from './indexing.mjs'

export async function prepareOffchainMessagesScenario(env, owners) {
  const context = await createSafe(env, owners)
  let unsigned
  try {
    const fixture = JSON.parse(
      await readFile(new URL('../../../cypress/fixtures/messages/messages.json', import.meta.url), 'utf8'),
    )
    const messages = fixture.results.filter(({ type }) => type === 'MESSAGE').map(({ message }) => message)
    for (const message of [...messages].reverse()) {
      const signed = await context.safe.signMessage(context.safe.createMessage(message))
      await context.api.addMessage(context.safeAddress, { message, signature: signed.encodedSignatures() })
    }
    await waitUntil(env, `${context.path}/messages`, (result) => {
      const actual = result.results.filter(({ type }) => type === 'MESSAGE')
      return (
        actual.length === 4 &&
        actual.every(
          (item, i) =>
            isDeepStrictEqual(item.message, messages[i]) &&
            item.confirmationsSubmitted === 1 &&
            item.confirmationsRequired === 2,
        )
      )
    })
    unsigned = await createSafe(env, owners)
    const message = 'Test message 2 off-chain'
    const signed = await unsigned.safe.signMessage(unsigned.safe.createMessage(message))
    await unsigned.api.addMessage(unsigned.safeAddress, { message, signature: signed.encodedSignatures() })
    await waitUntil(env, `${unsigned.path}/messages`, (result) =>
      result.results.some((item) => item.message === message && item.confirmationsSubmitted === 1),
    )
    return {
      safes: {
        static: {
          SEP_STATIC_SAFE_10: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_23: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_26: `sep:${unsigned.safeAddress}`,
        },
      },
    }
  } finally {
    context.provider.destroy()
    unsigned?.provider.destroy()
  }
}

export async function prepareOnchainMessagesScenario(env, owners) {
  const context = await createSafe(env, owners)
  try {
    const deployment = getSignMessageLibDeployment({ version: '1.3.0', network: context.chainId.toString() })
    const address = deployment?.networkAddresses[context.chainId.toString()]
    if (!address || (await context.provider.getCode(address)) === '0x')
      throw new Error('SignMessageLib is missing from the fork')
    const abi = new Interface(deployment.abi)
    const other = await Safe.init({
      provider: env.SAFE_RPC_URL,
      signer: owners.owner1.privateKey,
      safeAddress: context.safeAddress,
    })
    for (const [nonce, message] of ['Signed on-chain message', 'Pending on-chain message'].entries()) {
      const proposed = await proposeTransaction(
        context,
        await context.safe.createTransaction({
          transactions: [
            {
              to: address,
              value: '0',
              data: abi.encodeFunctionData('signMessage', [toUtf8Bytes(message)]),
              operation: 1,
            },
          ],
          options: { nonce },
        }),
      )
      if (nonce === 0) {
        const signature = await other.signHash(proposed.hash)
        await context.api.confirmTransaction(proposed.hash, signature.data)
        proposed.signed.addSignature(signature)
        await executeTransaction(context, proposed.signed)
      } else {
        await waitForQueued(env, context, [proposed.hash])
      }
    }
    return { safes: { static: { SEP_STATIC_SAFE_10: `sep:${context.safeAddress}` } } }
  } finally {
    context.provider.destroy()
  }
}
