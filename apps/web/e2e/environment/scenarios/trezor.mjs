import { HDNodeWallet } from 'ethers'
import { prepareDeviceSafes } from './hardware-wallet.mjs'

/** Trezor's public test mnemonic of the trezor-emulator service in infra/docker-compose.test.yml. */
export const TREZOR_TEST_MNEMONIC = 'all all all all all all all all all all all all'

/** The emulated Trezor's first Trezor Live account, which the Trezor specs select. */
export const trezorOwner = HDNodeWallet.fromPhrase(TREZOR_TEST_MNEMONIC, undefined, "m/44'/60'/0'/0/0")

/** The Safes of `prepareDeviceSafes` for the Trezor: `trezorSign` to sign, `trezorExecute` to execute. */
export async function prepareTrezorScenario(env, owners) {
  const { signing, executing } = await prepareDeviceSafes(env, owners, trezorOwner)
  return { safes: { trezorSign: `sep:${signing}`, trezorExecute: `sep:${executing}` } }
}
