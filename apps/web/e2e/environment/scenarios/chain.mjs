import { createRequire } from 'node:module'
import { AbiCoder, Interface, keccak256, solidityPacked, toBeHex } from 'ethers'
import { getMultiSendCallOnlyDeployment } from '@safe-global/safe-deployments'
import { sendAndConfirm } from './provider.mjs'

export const SEPOLIA = 11155111
/** 100 ETH, enough gas money for any setup account. */
export const FUNDED_BALANCE = '0x56bc75e2d63100000'
export const DELEGATE_CALL = 1

const require = createRequire(import.meta.url)
export const erc20Artifact = require('@openzeppelin/contracts/build/contracts/ERC20PresetFixedSupply.json')
export const erc721Artifact = require('@openzeppelin/contracts/build/contracts/ERC721PresetMinterPauserAutoId.json')
export const erc20 = new Interface([
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
])
const multiSendInterface = new Interface(['function multiSend(bytes)'])

/** The `0x1234...abcd` form the wallet shows for an address. */
export const short = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`

/** The address of an EIP-3770 Safe reference such as `sep:0x…`. */
export const addressOf = (prefixed) => prefixed.slice(prefixed.indexOf(':') + 1)

/** Runs `action` with a signer for `address` on the fork, which needs no key for it. */
export async function impersonated(provider, address, action) {
  await provider.send('anvil_setBalance', [address, FUNDED_BALANCE])
  await provider.send('anvil_impersonateAccount', [address])
  try {
    return await action(await provider.getSigner(address))
  } finally {
    await provider.send('anvil_stopImpersonatingAccount', [address])
  }
}

export function send(provider, from, transaction) {
  return impersonated(provider, from, (signer) => sendAndConfirm(signer, transaction))
}

/** One MultiSendCallOnly delegate call that runs `calls` in order with a single Safe nonce. */
export function multiSend(calls, { version = '1.4.1' } = {}) {
  return {
    to: getMultiSendCallOnlyDeployment({ version }).networkAddresses[SEPOLIA],
    operation: DELEGATE_CALL,
    data: multiSendInterface.encodeFunctionData('multiSend', [
      solidityPacked(
        calls.flatMap(() => ['uint8', 'address', 'uint256', 'uint256', 'bytes']),
        calls.flatMap(({ to, value = 0n, data = '0x' }) => [0, to, value, (data.length - 2) / 2, data]),
      ),
    ]),
  }
}

/** Mines empty blocks until one is later than `timestamp`; Anvil's clock is not the host clock to wait on. */
export async function waitForNextSecond(provider, timestamp) {
  while ((await provider.getBlock('latest')).timestamp <= timestamp) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    await provider.send('evm_mine', [])
  }
}

async function canTransfer(provider, token, holder, amount) {
  try {
    await provider.call({ from: holder, to: token, data: erc20.encodeFunctionData('transfer', [holder, amount]) })
    return true
  } catch {
    return false
  }
}

/** Writes an ERC-20 balance on the fork by finding the slot of the token's balance mapping. */
export async function dealToken(provider, token, holder, amount) {
  const value = toBeHex(amount, 32)
  for (let slot = 0; slot < 20; slot++) {
    const key = keccak256(AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [holder, slot]))
    const previous = await provider.getStorage(token, key)
    await provider.send('anvil_setStorageAt', [token, key, value])
    const [balance] = erc20.decodeFunctionResult(
      'balanceOf',
      await provider.call({ to: token, data: erc20.encodeFunctionData('balanceOf', [holder]) }),
    )
    // Airdrop-scam tokens report a fixed balanceOf for everyone, so also check the balance is spendable.
    if (balance === amount && (await canTransfer(provider, token, holder, amount))) return
    await provider.send('anvil_setStorageAt', [token, key, previous])
  }
  throw new Error(`No balance mapping found for token ${token}`)
}

/** Gives `holder` an ERC-20 balance and transfers it to `recipient`, so the indexer sees a Transfer event. */
export async function fundWithToken(provider, { token, holder, recipient, amount }) {
  await dealToken(provider, token, holder, amount)
  return send(provider, holder, { to: token, data: erc20.encodeFunctionData('transfer', [recipient, amount]) })
}
