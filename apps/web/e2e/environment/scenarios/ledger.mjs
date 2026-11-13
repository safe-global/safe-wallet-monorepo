import { HDNodeWallet } from 'ethers'
import { prepareDeviceSafes } from './hardware-wallet.mjs'

/** The public test mnemonic of the ledger-emulator service in infra/docker-compose.test.yml. */
export const LEDGER_TEST_MNEMONIC = 'solution enroll ozone error hazard glory reunion pear shoe rapid nephew kitchen'

/** The emulated Ledger's first Ledger Live account, which the Ledger specs select. */
export const ledgerOwner = HDNodeWallet.fromPhrase(LEDGER_TEST_MNEMONIC, undefined, "m/44'/60'/0'/0/0")

/** The Safes of `prepareDeviceSafes` for the Ledger: `ledgerSign` to sign, `ledgerExecute` to execute. */
export async function prepareLedgerScenario(env, owners) {
  const { signing, executing } = await prepareDeviceSafes(env, owners, ledgerOwner)
  return { safes: { ledgerSign: `sep:${signing}`, ledgerExecute: `sep:${executing}` } }
}
