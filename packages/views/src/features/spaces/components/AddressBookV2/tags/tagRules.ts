import { sanitizeName } from '@safe-global/utils/validation/names'

// Mirrors CGW's tag rules so a bad tag is explained before the request; CGW stays the authority.
export const MAX_TAGS_PER_CONTACT = 3
export const MAX_TAGS_PER_WORKSPACE = 8
export const TAG_NAME_MAX_LENGTH = 32

export const TAGS_DISCLAIMER = 'Tags are labels your team writes. They are not a verification.'

export const CONTACT_TAG_LIMIT_MESSAGE = `A contact can have at most ${MAX_TAGS_PER_CONTACT} tags`
export const WORKSPACE_TAG_LIMIT_MESSAGE = `Your workspace has ${MAX_TAGS_PER_WORKSPACE} tags. Rename or delete one to add another.`

const RESERVED_TAG_NAMES = new Set(['workspace safe', 'signer'])
const ALLOWED_TAG_NAME = /^[\p{L}\p{M}\p{N} \-_&/]+$/u
const FORBIDDEN_TAG_PREFIX = /^[=+\-@]/

/** The name as CGW stores it: sanitized, with runs of spaces collapsed. */
export const normalizeTagName = (raw: string): string => sanitizeName(raw).replace(/ {2,}/g, ' ')

export const sameTagName = (a: string, b: string): boolean =>
  normalizeTagName(a).toLowerCase() === normalizeTagName(b).toLowerCase()

export const validateTagName = (raw: string): string | undefined => {
  const name = normalizeTagName(raw)
  const length = [...name].length
  if (length === 0) return 'Tags cannot be empty'
  if (RESERVED_TAG_NAMES.has(name.toLowerCase()))
    return `'${name}' is added automatically and can't be used as a tag name`
  if (length > TAG_NAME_MAX_LENGTH) return `Tags must be at most ${TAG_NAME_MAX_LENGTH} characters long`
  if (FORBIDDEN_TAG_PREFIX.test(name)) return 'Tags cannot start with =, +, - or @'
  if (!ALLOWED_TAG_NAME.test(name)) return 'Tags can only contain letters, numbers, spaces and the characters - _ & /'
  return undefined
}

export const sameTagNames = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((name) => b.some((other) => sameTagName(name, other)))
