import type { ReactNode } from 'react'
import type { SpaceAuditLogEntryDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

// Payload shapes mirror the CGW audit event taxonomy. Payloads arrive
// untyped, so every field is treated as optional and unknown event types
// fall back to a generic description.

const FALLBACK_TARGET = 'a former member'

type Payload = Record<string, unknown>

const asPayload = (payload: object | undefined): Payload =>
  payload && typeof payload === 'object' ? (payload as Payload) : {}

const asString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined)

const asCount = (value: unknown): number => (Array.isArray(value) ? value.length : 0)

const formatRole = (value: unknown): string | undefined => asString(value)?.toLowerCase()

const pluralize = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? '' : 's'}`

const Em = ({ children }: { children: ReactNode }) => <span className="font-bold">{children}</span>

type Contact = { name?: string; address?: string }

const asContact = (value: unknown): Contact => {
  const item = asPayload(value as object)
  return { name: asString(item.name), address: asString(item.address) }
}

const asContacts = (value: unknown): Contact[] => (Array.isArray(value) ? value.map(asContact) : [])

const hasContactDetail = (contact: Contact): boolean => Boolean(contact.name || contact.address)

const ContactRef = ({ contact }: { contact: Contact }) => (
  <>
    {contact.name ? <Em>{contact.name}</Em> : 'a contact'}
    {contact.address ? <span className="break-all"> ({contact.address})</span> : null}
  </>
)

export function getTargetUserId(payload: SpaceAuditLogEntryDto['payload']): number | undefined {
  const targetUserId = asPayload(payload).targetUserId
  return typeof targetUserId === 'number' ? targetUserId : undefined
}

export function getDefaultTargetDisplay(event: SpaceAuditLogEntryDto): string {
  return event.targetUser || FALLBACK_TARGET
}

export function getAuditEventDescription(
  event: SpaceAuditLogEntryDto,
  targetDisplay: string = getDefaultTargetDisplay(event),
): ReactNode {
  const payload = asPayload(event.payload)
  const target = targetDisplay

  switch (event.eventType) {
    case 'SPACE_CREATED': {
      const name = asString(payload.name)
      return name ? (
        <>
          created the workspace <Em>{name}</Em>
        </>
      ) : (
        'created the workspace'
      )
    }
    case 'SPACE_UPDATED': {
      const oldName = asString(asPayload(payload.old as object).name)
      const newName = asString(asPayload(payload.new as object).name)
      if (oldName && newName) {
        return (
          <>
            renamed the workspace from <Em>{oldName}</Em> to <Em>{newName}</Em>
          </>
        )
      }
      return 'updated the workspace'
    }
    case 'SPACE_DELETED': {
      const name = asString(payload.name)
      return name ? (
        <>
          deleted the workspace <Em>{name}</Em>
        </>
      ) : (
        'deleted the workspace'
      )
    }
    case 'MEMBER_INVITED': {
      const role = formatRole(payload.role)
      return (
        <>
          {payload.reinvite === true ? 're-invited' : 'invited'} <Em>{target}</Em>
          {role ? ` as ${role}` : ''}
        </>
      )
    }
    case 'MEMBER_INVITE_ACCEPTED':
      return 'accepted their invitation'
    case 'MEMBER_INVITE_DECLINED':
      return 'declined their invitation'
    case 'MEMBER_INVITE_RENEWED':
      return (
        <>
          renewed the invitation for <Em>{target}</Em>
        </>
      )
    case 'MEMBER_ROLE_UPDATED': {
      const oldRole = formatRole(payload.oldRole)
      const newRole = formatRole(payload.newRole)
      if (oldRole && newRole) {
        return (
          <>
            changed the role of <Em>{target}</Em> from {oldRole} to {newRole}
          </>
        )
      }
      return (
        <>
          changed the role of <Em>{target}</Em>
        </>
      )
    }
    case 'MEMBER_ALIAS_UPDATED':
      return 'updated their alias'
    case 'MEMBER_REMOVED':
      return (
        <>
          removed <Em>{target}</Em> from the workspace
        </>
      )
    case 'MEMBER_LEFT':
      return payload.accountDeleted === true ? 'left the workspace (account deleted)' : 'left the workspace'
    case 'SAFE_ADDED': {
      const count = asCount(payload.safes)
      return count > 0 ? `added ${pluralize(count, 'Safe account')}` : 'added Safe accounts'
    }
    case 'SAFE_REMOVED': {
      const count = asCount(payload.safes)
      return count > 0 ? `removed ${pluralize(count, 'Safe account')}` : 'removed Safe accounts'
    }
    case 'ADDRESS_BOOK_UPSERTED': {
      const created = asContacts(payload.created)
      const updated = asContacts(payload.updated)
      const approvedSuffix = typeof payload.onBehalfOfUserId === 'number' ? ' (approved request)' : ''

      if (created.length === 1 && updated.length === 0 && hasContactDetail(created[0])) {
        return (
          <>
            added the contact <ContactRef contact={created[0]} />
            {approvedSuffix}
          </>
        )
      }
      if (updated.length === 1 && created.length === 0 && hasContactDetail(updated[0])) {
        return (
          <>
            updated the contact <ContactRef contact={updated[0]} />
            {approvedSuffix}
          </>
        )
      }

      const parts: string[] = []
      if (created.length > 0) parts.push(`added ${pluralize(created.length, 'contact')}`)
      if (updated.length > 0) parts.push(`updated ${pluralize(updated.length, 'contact')}`)
      const summary = parts.length > 0 ? parts.join(' and ') : 'updated the address book'
      return `${summary}${approvedSuffix}`
    }
    case 'ADDRESS_BOOK_DELETED': {
      const contact = asContact(payload)
      return hasContactDetail(contact) ? (
        <>
          removed the contact <ContactRef contact={contact} />
        </>
      ) : (
        'removed a contact'
      )
    }
    default:
      return 'made a change'
  }
}
