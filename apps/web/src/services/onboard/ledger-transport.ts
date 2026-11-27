import type { TransportFactory, TransportIdentifier } from '@ledgerhq/device-management-kit'

export type LedgerTransport = { factory: TransportFactory; identifier: TransportIdentifier }

/** USB through WebHID, or the Speculos emulator when `emulatorUrl` is set. */
export async function loadLedgerTransport(emulatorUrl: string): Promise<LedgerTransport> {
  if (emulatorUrl) {
    const { speculosTransportFactory, speculosIdentifier } = await import('@ledgerhq/device-transport-kit-speculos')
    return { factory: speculosTransportFactory(emulatorUrl), identifier: speculosIdentifier }
  }
  const { webHidTransportFactory, webHidIdentifier } = await import('@ledgerhq/device-transport-kit-web-hid')
  return { factory: webHidTransportFactory, identifier: webHidIdentifier }
}
