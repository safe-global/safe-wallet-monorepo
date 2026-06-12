import { ContactSource, type ExtendedContact } from '@/hooks/useAllAddressBooks'
import { formatTimeInWords } from '@safe-global/utils/utils/date'

export const CONTACT_RECENCY_WINDOW_DAYS = 7
const RECENCY_WINDOW_MS = CONTACT_RECENCY_WINDOW_DAYS * 24 * 60 * 60 * 1000

/**
 * Provenance fields the CGW send-flow contact payload will expose (WA-2560).
 * Optional until the endpoint ships — the UI only renders them when present.
 */
export type ContactProvenance = {
  addressChangedAt?: string
  addressChangedBy?: string
  previousAddress?: string
}

export type RecipientContact = ExtendedContact & ContactProvenance

const parseTimestamp = (timestamp?: string): number | undefined => {
  if (!timestamp) return undefined
  const time = Date.parse(timestamp)
  return Number.isNaN(time) ? undefined : time
}

const isWithinRecencyWindow = (timestamp?: string): boolean => {
  const time = parseTimestamp(timestamp)
  return time !== undefined && Date.now() - time < RECENCY_WINDOW_MS
}

export const isRecentlyAdded = (contact: RecipientContact): boolean =>
  contact.source !== ContactSource.local && isWithinRecencyWindow(contact.createdAt)

export const isRecentlyChanged = (contact: RecipientContact): boolean => isWithinRecencyWindow(contact.addressChangedAt)

export const formatRelativeTime = (timestamp: string): string | undefined => {
  const time = parseTimestamp(timestamp)
  return time === undefined ? undefined : formatTimeInWords(time)
}

export const formatExactTime = (timestamp: string): string | undefined => {
  const time = parseTimestamp(timestamp)
  return time === undefined
    ? undefined
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(time)
}

export type ProvenanceLine = {
  text: string
  timestamp?: string
}

export const getProvenanceLine = (contact: RecipientContact): ProvenanceLine | undefined => {
  if (isRecentlyChanged(contact)) {
    return {
      text: contact.addressChangedBy ? `Address changed by ${contact.addressChangedBy}` : 'Address changed',
      timestamp: contact.addressChangedAt,
    }
  }

  if (contact.source === ContactSource.local) {
    return { text: 'Saved on this device' }
  }

  if (contact.createdBy) {
    return { text: `Added by ${contact.createdBy}`, timestamp: contact.createdAt || undefined }
  }

  return undefined
}
