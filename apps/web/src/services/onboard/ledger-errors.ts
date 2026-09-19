/**
 * Ledger's DMK reports failures as tagged objects, not `Error`s: `{ _tag, originalError?, errorCode? }`. The
 * device's explanation lives in `message`, `originalError.message`, or (for an unmodelled status word) inside
 * `originalError`. Dropping it as `'unknown'` leaves nothing to act on; serialising the raw object leaks
 * internals to the screen (WA-3243). So: read the reason, classify, translate, and keep the raw evidence in
 * the error's `info` payload — read by debugging sinks, never rendered.
 */

import type { DmkError } from '@ledgerhq/device-management-kit'

import type { LedgerDeviceErrorInfo, LedgerDeviceErrorReason } from './types'

/**
 * Runtime marker on every mapped error, letting `getLedgerDeviceError` recognise the payload after viem
 * re-wraps it. Typed from the interface field so const and type can't drift (a mismatch disables the feature).
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
 * Transport-level tags (cable/WebHID/session lost). These are runtime `_tag` values, not always the SDK
 * export name (`OpeningConnectionError` declares `_tag = 'ConnectionOpeningError'`), so each was read off the
 * shipped class; the table test below pins all nine so a rename can't silently un-map one.
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
 * The message a rejection carries. Two constraints: `matchUserOutcome` classifies on wording, so "rejected
 * the request" must survive verbatim or a cancellation counts as a failure (WA-2950); and the account picker
 * renders it raw, so it must read as copy. (tx/message flows show `USER_MESSAGES.rejected` from the reason instead.)
 */
const REJECTION_MESSAGE = 'You rejected the request on your Ledger.'

const readString = (source: unknown, key: string): string | undefined => {
  if (typeof source !== 'object' || source === null) return undefined
  const value = (source as Record<string, unknown>)[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/**
 * The status word wherever the kit put it: on the error for `DeviceExchangeError`, nested in `originalError`
 * for unmodelled words (`UnknownDeviceExchangeError`). Reading both keeps the paths consistent — e.g. a `6982`
 * raised by the global handler lands in `originalError` yet still maps to `rejected`. No shipped firmware does
 * this today (locked is `5515` only), but this is insurance. Lower-cased to match the lower-case hex tables.
 */
const readErrorCode = (error: DmkError): string | undefined =>
  (readString(error, 'errorCode') ?? readString(error.originalError, 'errorCode'))?.toLowerCase()

/**
 * The device's own explanation. `InvalidStatusWordError` has no `message` — its text is an `Error` under
 * `originalError`, which serialises to `{}`; that's why these failures reached users as `unknown`.
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
 * Support reference for a device failure with no sentence. Only the status word is exposed; the tag and raw
 * device words stay in telemetry (they name internals).
 */
export const getLedgerSupportReference = (info: LedgerDeviceErrorInfo): string =>
  `LEDGER-${info.errorCode ? `0x${info.errorCode}` : 'UNKNOWN'}`

const isLedgerDeviceErrorInfo = (value: unknown): value is LedgerDeviceErrorInfo =>
  typeof value === 'object' && value !== null && (value as LedgerDeviceErrorInfo).source === LEDGER_ERROR_SOURCE

/** Guards against a self-referencing cause chain. */
const MAX_CAUSE_DEPTH = 10

/**
 * Recovers the device reason from a re-wrapped error (ethers → viem's `UnknownRpcError` → maybe protocol-kit).
 * Each wrapper keeps the previous as `cause`, so the payload is always reachable down the chain.
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
 * Built by hand, not with ethers' `makeError` (which appends every `info` key plus `code=`/`version=` to
 * `message` and keeps the clean sentence only in `shortMessage`). The account picker renders `message`
 * verbatim and we can't intercept it, so the sentence must BE the message and evidence rides on unrendered
 * fields (WA-3243).
 */
const buildLedgerError = (message: string, fields: LedgerErrorFields): Error =>
  Object.assign(new Error(message), fields)

/**
 * Converts a DMK failure into the error the EIP-1193 provider must reject with. The message is the
 * user-facing sentence and nothing else (reads correctly wherever rendered raw); the device's words ride in
 * `info`, read by debugging sinks and touched by no renderer.
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
