import { parseEther } from 'ethers'
import { FUNDED_BALANCE } from './chain.mjs'
import { waitForQueued } from './indexing.mjs'
import { createSafe, openSafe, proposeTransaction } from './safe.mjs'

function transferToOwner1(context, owners) {
  return context.safe.createTransaction({
    transactions: [{ to: owners.owner1.address, value: parseEther('0.001').toString(), data: '0x' }],
    options: { nonce: 0 },
  })
}

/**
 * Two Safes owned by the account `device` of an emulated hardware wallet, each with one queued transfer:
 * - `signing`, 3/3 with OWNER_1 and OWNER_2. OWNER_1 has signed, so the device can only sign, not execute.
 * - `executing`, 1/1, signed by the device key; the device executes it and pays the gas.
 */
export async function prepareDeviceSafes(env, owners, device) {
  const signing = await createSafe(env, owners, {
    ownerAddresses: [device.address, owners.owner1.address, owners.owner2.address],
    threshold: 3,
  })
  let executing
  try {
    executing = await createSafe(env, owners, { ownerAddresses: [device.address], threshold: 1 })
    await executing.provider.send('anvil_setBalance', [device.address, FUNDED_BALANCE])
    const owner1 = await openSafe(env, owners.owner1, signing.safeAddress)
    const toSign = await proposeTransaction(signing, await transferToOwner1(signing, owners), { proposer: owner1 })
    const deviceOwner = await openSafe(env, device, executing.safeAddress)
    const toExecute = await proposeTransaction(executing, await transferToOwner1(executing, owners), {
      proposer: deviceOwner,
    })
    await waitForQueued(env, signing, [toSign.hash])
    await waitForQueued(env, executing, [toExecute.hash])
    return { signing: signing.safeAddress, executing: executing.safeAddress }
  } finally {
    signing.provider.destroy()
    executing?.provider.destroy()
  }
}
