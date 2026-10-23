import { Contract, getAddress, zeroPadValue } from 'ethers'
import { readChain } from './local-provider'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'

/** The Safe proxy keeps the address of its singleton (master copy) in storage slot 0 */
const SINGLETON_SLOT = 0

/** The Safe version and the singleton contract that the proxy at `safeAddress` delegates to */
export function readSingleton(
  env: JourneyEnvironment,
  safeAddress: string,
): Promise<{ version: string; singleton: string }> {
  return readChain(env, async (provider) => {
    const safe = new Contract(safeAddress, ['function VERSION() view returns (string)'], provider)
    const [version, slot] = await Promise.all([safe.VERSION(), provider.getStorage(safeAddress, SINGLETON_SLOT)])
    return { version, singleton: getAddress(zeroPadValue(`0x${slot.slice(-40)}`, 20)) }
  })
}
