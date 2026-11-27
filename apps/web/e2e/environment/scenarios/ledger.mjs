import { HDNodeWallet, parseEther } from 'ethers'
import { FUNDED_BALANCE } from './chain.mjs'
import { waitForQueued } from './indexing.mjs'
import { createSafe, openSafe, proposeTransaction } from './safe.mjs'

/** The public test mnemonic of the ledger-emulator service in infra/docker-compose.test.yml. */
export const LEDGER_TEST_MNEMONIC = 'solution enroll ozone error hazard glory reunion pear shoe rapid nephew kitchen'

/** The emulated Ledger's first Ledger Live account, which the Ledger specs select. */
export const ledgerOwner = HDNodeWallet.fromPhrase(LEDGER_TEST_MNEMONIC, undefined, "m/44'/60'/0'/0/0")

function transferToOwner1(context, owners) {
  return context.safe.createTransaction({
    transactions: [{ to: owners.owner1.address, value: parseEther('0.001').toString(), data: '0x' }],
    options: { nonce: 0 },
  })
}

/**
 * Two Safes owned by the emulated Ledger, each with one queued transfer:
 * - SEP_STATIC_SAFE_48, 3/3 with OWNER_1 and OWNER_2. OWNER_1 has signed, so the Ledger can only sign, not execute.
 * - SEP_STATIC_SAFE_49, 1/1, signed by the Ledger key; the Ledger executes it and pays the gas.
 */
export async function prepareLedgerScenario(env, owners) {
  const signing = await createSafe(env, owners, {
    ownerAddresses: [ledgerOwner.address, owners.owner1.address, owners.owner2.address],
    threshold: 3,
  })
  let executing
  try {
    executing = await createSafe(env, owners, { ownerAddresses: [ledgerOwner.address], threshold: 1 })
    await executing.provider.send('anvil_setBalance', [ledgerOwner.address, FUNDED_BALANCE])
    const owner1 = await openSafe(env, owners.owner1, signing.safeAddress)
    const toSign = await proposeTransaction(signing, await transferToOwner1(signing, owners), { proposer: owner1 })
    const ledger = await openSafe(env, ledgerOwner, executing.safeAddress)
    const toExecute = await proposeTransaction(executing, await transferToOwner1(executing, owners), {
      proposer: ledger,
    })
    await waitForQueued(env, signing, [toSign.hash])
    await waitForQueued(env, executing, [toExecute.hash])
    return {
      safes: {
        static: {
          SEP_STATIC_SAFE_48: `sep:${signing.safeAddress}`,
          SEP_STATIC_SAFE_49: `sep:${executing.safeAddress}`,
        },
      },
    }
  } finally {
    signing.provider.destroy()
    executing?.provider.destroy()
  }
}
