import type { DmkError } from '@ledgerhq/device-management-kit'
import { ErrorType } from '@safe-global/utils/services/exceptions/errorTaxonomy'
import { matchUserOutcome, normalizeError } from '@safe-global/utils/services/exceptions/normalizeError'
import { isWalletRejection } from '@/utils/wallets'
import type { EthersError } from '@/utils/ethers-utils'

import {
  getLedgerDeviceError,
  getLedgerSupportReference,
  getLedgerUserMessage,
  mapLedgerError,
  readLedgerDeviceError,
} from './ledger-errors'

type MappedError = EthersError & { shortMessage?: string }

/**
 * Substrings that must never reach a user-facing string: library names and
 * versions, DMK/ethers class names and codes, and serialised payloads.
 */
const FORBIDDEN_IN_UI = ['viem@', 'version=', 'code=', 'info={', 'Error', '_tag', '{', '}']

/** `InvalidStatusWordError`: no `message`, the reason hides in `originalError`. */
const invalidStatusWord = (message?: string): DmkError => ({
  _tag: 'InvalidStatusWordError',
  ...(message ? { originalError: new Error(message) } : {}),
})

/** `DeviceExchangeError` subclasses (eth app, global handler) carry a status word. */
const deviceExchangeError = (tag: string, errorCode: string, message: string): DmkError =>
  ({ _tag: tag, errorCode, message }) as DmkError

/** How the error looks by the time it is displayed: ethers → viem → protocol-kit. */
const wrapLikeViem = (cause: Error): Error =>
  Object.assign(new Error(`An unknown RPC error occurred.\n\nDetails: ${cause.message}\n\nVersion: viem@2.52.2`), {
    cause,
  })

describe('ledger-errors', () => {
  describe('readLedgerDeviceError', () => {
    it('recovers the reason an InvalidStatusWordError hides in originalError', () => {
      expect(readLedgerDeviceError(invalidStatusWord('no signature returned'))).toEqual({
        source: 'ledger-device',
        reason: 'unknown',
        tag: 'InvalidStatusWordError',
        errorCode: undefined,
        deviceMessage: 'no signature returned',
      })
    })

    it('never invents a reason when the device gave none', () => {
      const info = readLedgerDeviceError(invalidStatusWord())

      expect(info.deviceMessage).toBeUndefined()
      expect(info.tag).toBe('InvalidStatusWordError')
      expect(info.reason).toBe('unknown')
    })

    it('reads a status word nested in originalError (UnknownDeviceExchangeError)', () => {
      const info = readLedgerDeviceError({
        _tag: 'UnknownDeviceExchangeError',
        originalError: { message: 'UnknownError', errorCode: '6511' },
        message: 'Unexpected device exchange error happened.',
      } as DmkError)

      expect(info.errorCode).toBe('6511')
      expect(info.reason).toBe('app_closed')
    })

    it.each([
      { tag: 'EthAppCommandError', errorCode: '6985', message: 'Condition not satisfied', reason: 'rejected' },
      { tag: 'EthAppCommandError', errorCode: '6982', message: 'Canceled by user', reason: 'rejected' },
      { tag: 'DeviceLockedError', errorCode: '5515', message: 'Device is locked.', reason: 'locked' },
      { tag: 'OpenAppCommandError', errorCode: '6807', message: 'Unknown application name', reason: 'app_closed' },
      { tag: 'DeviceInternalError', errorCode: '6e00', message: 'CLA not supported', reason: 'app_closed' },
      { tag: 'EthAppCommandError', errorCode: '6a80', message: 'Invalid data', reason: 'blind_signing' },
    ])('classifies $tag (0x$errorCode) as $reason', ({ tag, errorCode, message, reason }) => {
      expect(readLedgerDeviceError(deviceExchangeError(tag, errorCode, message)).reason).toBe(reason)
    })

    it.each(['WebHidSendReportError', 'DeviceDisconnectedWhileSendingError', 'ReconnectionFailedError'])(
      'classifies the transport failure %s as a lost connection',
      (tag) => {
        expect(readLedgerDeviceError({ _tag: tag, originalError: new Error('boom') }).reason).toBe('connection')
      },
    )

    it('classifies a tagless shape without throwing', () => {
      expect(readLedgerDeviceError({} as DmkError)).toEqual({
        source: 'ledger-device',
        reason: 'unknown',
        tag: 'UnknownDmkError',
        errorCode: undefined,
        deviceMessage: undefined,
      })
    })
  })

  describe('getLedgerUserMessage', () => {
    it.each([
      ['5501', 'Transaction rejected on your Ledger.'],
      ['5515', 'Unlock your Ledger and try again.'],
      ['6807', 'Open the Ethereum app on your Ledger.'],
      ['6a80', 'Enable blind signing in the Ethereum app on your Ledger, then try again.'],
    ])('translates the device state 0x%s', (errorCode, expected) => {
      const info = readLedgerDeviceError(deviceExchangeError('EthAppCommandError', errorCode, 'raw device text'))
      expect(getLedgerUserMessage(info)).toBe(expected)
    })

    it('translates a lost transport into a reconnect instruction', () => {
      const info = readLedgerDeviceError({ _tag: 'DisconnectError' })
      expect(getLedgerUserMessage(info)).toBe('Lost connection to your Ledger. Reconnect it and try again.')
    })

    it('falls back to one sentence plus a support reference for an unmapped state', () => {
      const info = readLedgerDeviceError(invalidStatusWord('The context type [x] is not covered'))

      expect(getLedgerUserMessage(info)).toBe('Your Ledger could not complete the request.')
      expect(getLedgerSupportReference(info)).toBe('LEDGER-UNKNOWN')
    })

    it('puts the status word — and nothing else — in the support reference', () => {
      const info = readLedgerDeviceError(deviceExchangeError('EthAppCommandError', '6f00', 'Technical problem'))

      expect(info.reason).toBe('unknown')
      expect(getLedgerSupportReference(info)).toBe('LEDGER-0x6f00')
    })

    it('never exposes internals in any translated sentence or reference', () => {
      const errors: DmkError[] = [
        invalidStatusWord('no signature returned'),
        invalidStatusWord(),
        deviceExchangeError('EthAppCommandError', '6985', 'Condition not satisfied'),
        deviceExchangeError('DeviceLockedError', '5515', 'Device is locked.'),
        deviceExchangeError('EthAppCommandError', '6a80', 'Invalid data'),
        { _tag: 'WebHidSendReportError', originalError: new Error('The device is not connected') },
        {} as DmkError,
      ]

      for (const error of errors) {
        const info = readLedgerDeviceError(error)
        const rendered = `${getLedgerUserMessage(info)} ${getLedgerSupportReference(info)}`

        for (const forbidden of FORBIDDEN_IN_UI) {
          expect(rendered).not.toContain(forbidden)
        }
        expect(rendered).not.toContain(info.tag)
        expect(rendered).not.toBe('unknown')
      }
    })
  })

  describe('mapLedgerError', () => {
    it('never emits the literal "unknown" for an InvalidStatusWordError', () => {
      const error = mapLedgerError(invalidStatusWord('no signature returned')) as MappedError

      expect(error.shortMessage).toBe('Your Ledger could not complete the request.')
      expect(error.code).toBe('UNKNOWN_ERROR')
      expect(error.message).not.toContain('unknown (')
    })

    it('keeps the device reason on the error for the debugging sinks', () => {
      const error = mapLedgerError(invalidStatusWord('V is missing'))

      expect(getLedgerDeviceError(error)).toMatchObject({
        tag: 'InvalidStatusWordError',
        deviceMessage: 'V is missing',
      })
      // The raw evidence must survive serialisation into `error.message`, which
      // is what Datadog records — an `Error` in `originalError` serialised to
      // `{}` and lost it (WA-3243).
      expect(error.message).toContain('V is missing')
      expect(error.message).toContain('InvalidStatusWordError')
    })

    it('classifies a device failure as a Ledger error rather than unknown', () => {
      const error = mapLedgerError(invalidStatusWord('no signature returned'))
      const coded = `Code 804: Error executing a transaction (${wrapLikeViem(error).message})`

      expect(normalizeError({ code: 804, message: coded, isUserFacing: true }).type).toBe(ErrorType.LEDGER_ERROR)
    })

    it.each([
      { tag: 'EthAppCommandError', errorCode: '6985' },
      { tag: 'DeviceInternalError', errorCode: '5501' },
      { tag: 'EthAppCommandError', errorCode: '6982' },
    ])('reports a rejection carried by $tag (0x$errorCode) as a rejection, not a failure', ({ tag, errorCode }) => {
      const error = mapLedgerError(deviceExchangeError(tag, errorCode, 'raw device text')) as MappedError

      expect(error.code).toBe('ACTION_REJECTED')
      expect(isWalletRejection(error)).toBe(true)
      expect(isWalletRejection(wrapLikeViem(error))).toBe(true)
      expect(matchUserOutcome(wrapLikeViem(error).message)).toBe(ErrorType.USER_REJECTED)
    })

    it('reports a rejection signalled by tag alone as a rejection', () => {
      const error = mapLedgerError({ _tag: 'RefusedByUserDAError' }) as MappedError

      expect(error.code).toBe('ACTION_REJECTED')
      expect(matchUserOutcome(error.message)).toBe(ErrorType.USER_REJECTED)
    })

    it('does not report a locked device as a rejection', () => {
      const error = mapLedgerError(deviceExchangeError('DeviceLockedError', '5515', 'Device is locked.'))

      expect(isWalletRejection(error)).toBe(false)
      expect(matchUserOutcome(wrapLikeViem(error).message)).toBeUndefined()
    })
  })

  describe('getLedgerDeviceError', () => {
    it('finds the device reason through the viem re-wrap that reaches the UI', () => {
      const wrapped = wrapLikeViem(
        mapLedgerError(deviceExchangeError('DeviceLockedError', '5515', 'Device is locked.')),
      )

      expect(getLedgerDeviceError(wrapped)?.reason).toBe('locked')
    })

    it('finds the device reason through several layers of wrapping', () => {
      const wrapped = Object.assign(new Error('Failed to execute transaction'), {
        cause: wrapLikeViem(mapLedgerError(invalidStatusWord('no signature returned'))),
      })

      expect(getLedgerDeviceError(wrapped)?.tag).toBe('InvalidStatusWordError')
    })

    it('ignores errors that are not Ledger device failures', () => {
      expect(getLedgerDeviceError(new Error('execution reverted'))).toBeUndefined()
      expect(getLedgerDeviceError(Object.assign(new Error('rpc'), { info: { payload: {} } }))).toBeUndefined()
      expect(getLedgerDeviceError(undefined)).toBeUndefined()
    })

    it('terminates on a self-referencing cause chain', () => {
      const error: Error & { cause?: unknown } = new Error('loop')
      error.cause = error

      expect(getLedgerDeviceError(error)).toBeUndefined()
    })
  })
})
