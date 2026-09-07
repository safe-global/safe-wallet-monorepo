/**
 * Ledger's Device Management Kit reports failures as tagged objects, not as
 * `Error`s: `{ _tag, originalError?, errorCode? }`. The device's own
 * explanation lives in `message`, in `originalError.message`, or — for a status
 * word the kit does not model — inside `originalError`. Dropping it (as a bare
 * `'unknown'`) leaves both the user and Datadog with nothing to act on, and
 * serialising the raw object leaks internals onto the screen (WA-3243).
 *
 * So: read the reason, classify it, translate it, and keep the raw evidence in
 * the error's `info` payload, which reaches the debugging sinks but is never
 * rendered.
 */

import type { DmkError } from '@ledgerhq/device-management-kit'

import type { LedgerDeviceErrorInfo, LedgerDeviceErrorReason } from './types'

/**
 * The runtime marker written into every mapped error. Annotated with the
 * interface's own field type so the const and the type cannot drift apart
 * silently — that marker is what lets `getLedgerDeviceError` recognise the
 * payload after viem re-wraps the error, so a mismatch would quietly disable
 * the whole feature.
 */
const LEDGER_ERROR_SOURCE: LedgerDeviceErrorInfo['source'] = 'ledger-device'

/**
 * APDU status words. The Ethereum app and the DMK global handler both report
 * these; the same word means the same thing whichever class carries it.
 */
const StatusWord = {
  ACTION_REFUSED: '5501',
  DEVICE_LOCKED: '5515',
  SECURITY_STATUS_NOT_SATISFIED: '6982',
  CONDITION_NOT_SATISFIED: '6985',
  APP_NOT_OPEN: '6511',
  UNKNOWN_APP: '6807',
  NO_APP_NAME: '670a',
  INVALID_DATA: '6a80',
  INS_NOT_SUPPORTED: '6d00',
  CLA_NOT_SUPPORTED: '6e00',
} as const

const REJECTION_CODES: ReadonlySet<string> = new Set([
  StatusWord.ACTION_REFUSED,
  StatusWord.SECURITY_STATUS_NOT_SATISFIED,
  StatusWord.CONDITION_NOT_SATISFIED,
])

const APP_CODES: ReadonlySet<string> = new Set([
  StatusWord.APP_NOT_OPEN,
  StatusWord.UNKNOWN_APP,
  StatusWord.NO_APP_NAME,
  StatusWord.INS_NOT_SUPPORTED,
  StatusWord.CLA_NOT_SUPPORTED,
])

/** DMK tags that carry a rejection without a status word. */
const REJECTION_TAGS: ReadonlySet<string> = new Set(['ActionRefusedError', 'RefusedByUserDAError'])

const LOCKED_TAGS: ReadonlySet<string> = new Set(['DeviceLockedError'])

const APP_TAGS: ReadonlySet<string> = new Set(['OpenAppCommandError'])

/**
 * Transport-level tags: the cable, the WebHID handle or the session went away.
 *
 * These are runtime `_tag` values, which are not always the SDK's export name —
 * `OpeningConnectionError` declares `_tag = 'ConnectionOpeningError'`. Every
 * entry here was read off the shipped class, not off the export, and the table
 * test below pins all nine so a rename cannot silently un-map one.
 */
const CONNECTION_TAGS: ReadonlySet<string> = new Set([
  'ConnectionOpeningError',
  'DeviceDisconnectedBeforeSendingApdu',
  'DeviceDisconnectedWhileSendingError',
  'DeviceNotRecognizedError',
  'DisconnectError',
  'NoAccessibleDeviceError',
  'ReconnectionFailedError',
  'SendApduTimeoutError',
  'WebHidSendReportError',
])

const USER_MESSAGES: Record<LedgerDeviceErrorReason, string> = {
  rejected: 'Transaction rejected on your Ledger.',
  locked: 'Unlock your Ledger and try again.',
  app_closed: 'Open the Ethereum app on your Ledger.',
  blind_signing: 'Enable blind signing in the Ethereum app on your Ledger, then try again.',
  connection: 'Lost connection to your Ledger. Reconnect it and try again.',
  unknown: 'Your Ledger could not complete the request.',
}

/**
 * The message a rejection carries. Two constraints meet here: `matchUserOutcome`
 * classifies purely on wording, so the phrase "rejected the request" has to
 * survive verbatim or a cancellation starts counting as a failure (WA-2950) —
 * and the account picker renders this string raw, so it also has to read as
 * copy. ethers' own `user rejected action` satisfied only the first.
 *
 * The tx and message flows show `USER_MESSAGES.rejected` instead; they resolve
 * the sentence from the reason rather than from this message.
 */
const REJECTION_MESSAGE = 'You rejected the request on your Ledger.'

const readString = (source: unknown, key: string): string | undefined => {
  if (typeof source !== 'object' || source === null) return undefined
  const value = (source as Record<string, unknown>)[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/**
 * The status word, wherever the kit put it: on the error for a
 * `DeviceExchangeError`, nested in `originalError` for the status words it
 * does not model (`UnknownDeviceExchangeError`).
 *
 * A status word nested in `originalError` is worth noting: an eth-app code that
 * arrives outside the app's own table (e.g. `6982` raised by the global
 * handler) becomes an `UnknownDeviceExchangeError` whose plain-object
 * `originalError` still carries the code, so it classifies the same way it
 * would have on the typed class — a `6982` there maps to `rejected` and is
 * suppressed everywhere. No shipped DMK-supported firmware does this today
 * (locked is signalled by `5515` exclusively), but reading the code from both
 * places is what keeps the two paths consistent if one ever does.
 *
 * Lower-cased because the comparison tables are lower-case hex. The kit emits
 * lower case today (`bufferToHexaString` goes through `toString(16)`); this is
 * insurance, and the casing of a hex status word carries no information.
 */
const readErrorCode = (error: DmkError): string | undefined =>
  (readString(error, 'errorCode') ?? readString(error.originalError, 'errorCode'))?.toLowerCase()

/**
 * The device's own explanation. `InvalidStatusWordError` has no `message` at
 * all — its text is wrapped in an `Error` under `originalError`, which
 * serialises to `{}` and is why these failures reached users as `unknown`.
 */
const readDeviceMessage = (error: DmkError): string | undefined =>
  readString(error, 'message') ?? readString(error.originalError, 'message')

const resolveReason = (tag: string, errorCode: string | undefined): LedgerDeviceErrorReason => {
  if (REJECTION_TAGS.has(tag) || (errorCode && REJECTION_CODES.has(errorCode))) return 'rejected'
  if (LOCKED_TAGS.has(tag) || errorCode === StatusWord.DEVICE_LOCKED) return 'locked'
  if (APP_TAGS.has(tag) || (errorCode && APP_CODES.has(errorCode))) return 'app_closed'
  if (errorCode === StatusWord.INVALID_DATA) return 'blind_signing'
  if (CONNECTION_TAGS.has(tag)) return 'connection'
  return 'unknown'
}

/** Reads what the device said, without interpreting it. */
export const readLedgerDeviceError = (error: DmkError): LedgerDeviceErrorInfo => {
  const tag = readString(error, '_tag') ?? 'UnknownDmkError'
  const errorCode = readErrorCode(error)

  return {
    source: LEDGER_ERROR_SOURCE,
    reason: resolveReason(tag, errorCode),
    tag,
    errorCode,
    deviceMessage: readDeviceMessage(error),
  }
}

/** The sentence shown to the user. Never contains device or library internals. */
export const getLedgerUserMessage = (info: LedgerDeviceErrorInfo): string => USER_MESSAGES[info.reason]

/**
 * Support reference for a device failure we have no sentence for. Only the
 * status word is exposed — the tag and the device's raw words stay in
 * telemetry, as they name internals.
 */
export const getLedgerSupportReference = (info: LedgerDeviceErrorInfo): string =>
  `LEDGER-${info.errorCode ? `0x${info.errorCode}` : 'UNKNOWN'}`

const isLedgerDeviceErrorInfo = (value: unknown): value is LedgerDeviceErrorInfo =>
  typeof value === 'object' && value !== null && (value as LedgerDeviceErrorInfo).source === LEDGER_ERROR_SOURCE

/** Guards against a self-referencing cause chain. */
const MAX_CAUSE_DEPTH = 10

/**
 * Recovers the device reason from an error that has since been re-wrapped —
 * ethers hands the rejection to viem, which wraps it in `UnknownRpcError`, and
 * protocol-kit may wrap that again. Each wrapper keeps the previous error as
 * `cause`, so the payload is always reachable from the chain.
 */
export const getLedgerDeviceError = (error: unknown): LedgerDeviceErrorInfo | undefined => {
  let current: unknown = error

  for (let depth = 0; depth < MAX_CAUSE_DEPTH && typeof current === 'object' && current !== null; depth++) {
    const { info, cause } = current as { info?: unknown; cause?: unknown }
    if (isLedgerDeviceErrorInfo(info)) return info
    current = cause
  }

  return undefined
}

/** ethers error codes our consumers key off. */
type LedgerErrorCode = 'ACTION_REJECTED' | 'UNKNOWN_ERROR'

interface LedgerErrorFields {
  readonly code: LedgerErrorCode
  /** ethers' own name for the untouched sentence; kept so `isError`-style consumers still find it. */
  readonly shortMessage: string
  readonly info: LedgerDeviceErrorInfo
  /** ethers' `ActionRejectedError` shape, preserved for anything matching on it. */
  readonly action?: 'unknown'
  readonly reason?: 'rejected'
}

/**
 * Builds the error by hand rather than with ethers' `makeError`, which appends
 * every `info` key plus `code=` and `version=` to `message` and keeps the clean
 * sentence only in `shortMessage`. `message` is what gets rendered — the
 * wallet-connect account picker (`@web3-onboard/hw-common`) prints it verbatim
 * and we cannot intercept it — so the sentence has to BE the message, and the
 * evidence has to ride on fields nothing renders (WA-3243).
 */
const buildLedgerError = (message: string, fields: LedgerErrorFields): Error =>
  Object.assign(new Error(message), fields)

/**
 * Converts a DMK failure into the error the EIP-1193 provider must reject with.
 *
 * The message is the user-facing sentence and nothing else, so it reads
 * correctly wherever it is rendered raw; the device's own words ride along in
 * `info`, which the debugging sinks read and no renderer touches.
 */
export const mapLedgerError = (error: DmkError): Error => {
  const info = readLedgerDeviceError(error)

  if (info.reason === 'rejected') {
    return buildLedgerError(REJECTION_MESSAGE, {
      code: 'ACTION_REJECTED',
      shortMessage: REJECTION_MESSAGE,
      action: 'unknown',
      reason: 'rejected',
      info,
    })
  }

  const message = getLedgerUserMessage(info)
  return buildLedgerError(message, { code: 'UNKNOWN_ERROR', shortMessage: message, info })
}
