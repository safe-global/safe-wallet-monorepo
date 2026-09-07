/** What the device is actually telling us, in terms a user can act on. */
export type LedgerDeviceErrorReason = 'rejected' | 'locked' | 'app_closed' | 'blind_signing' | 'connection' | 'unknown'

/**
 * Marks an ethers error as originating from a Ledger device. Attached as the
 * error's `info` so it survives every re-wrap (ethers → viem → protocol-kit)
 * and can be recovered from the cause chain at the point of display.
 */
export interface LedgerDeviceErrorInfo {
  readonly source: 'ledger-device'
  readonly reason: LedgerDeviceErrorReason
  /** DMK error class discriminator, e.g. `InvalidStatusWordError`. Debugging sinks only. */
  readonly tag: string
  /** APDU status word as reported by the device, e.g. `5515`. */
  readonly errorCode?: string
  /** The device's own words, e.g. `no signature returned`. Debugging sinks only. */
  readonly deviceMessage?: string
}
