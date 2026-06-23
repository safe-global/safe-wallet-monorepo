// Mirror of safe-client-gateway/src/domain/common/schemas/name.schema.ts. Keep in lockstep.
// names.test.ts (ported from name.schema.spec.ts) is the drift guard.

export const NAME_MIN_LENGTH = 3
export const NAME_MAX_LENGTH = 30
export const ADDRESS_BOOK_NAME_MAX_LENGTH = 50
export const MEMBER_NAME_MAX_LENGTH = 255
// CGW has no dedicated constants for these; both use the default NameSchema (max 30).
export const MEMBER_ALIAS_MAX_LENGTH = NAME_MAX_LENGTH
export const SPACE_NAME_MAX_LENGTH = NAME_MAX_LENGTH

const INVISIBLE_CHARACTERS = /[\p{Cc}\p{Cf}]/gu

// Folded to ASCII: smart quotes/prime -> ', en/em dash/minus -> -
const SMART_PUNCTUATION: ReadonlyArray<[RegExp, string]> = [
  [/[‘’‚‛′]/gu, "'"],
  [/[–—−]/gu, '-'],
]

const ALLOWED_PUNCTUATION = " ._\\-#@&',()"

export const ALLOWED_NAME_REGEX = new RegExp(`^[\\p{L}\\p{M}\\p{N}${ALLOWED_PUNCTUATION}]*$`, 'u')

export const DISALLOWED_CHARACTER_MESSAGE =
  "Names can only contain letters, numbers, spaces and the characters . _ - # @ & ' , ( )"

export const DISALLOWED_CHARACTER_SHORT_MESSAGE = 'Invalid characters'

export interface NameValidationDisplay {
  label: string
  tooltip?: string
}

export const getNameValidationDisplay = (message: string): NameValidationDisplay => {
  if (message === DISALLOWED_CHARACTER_MESSAGE) {
    return { label: DISALLOWED_CHARACTER_SHORT_MESSAGE, tooltip: message }
  }
  return { label: message }
}

export const EMPTY_NAME_MESSAGE = 'Names cannot be empty'

export const sanitizeName = (value: string): string => {
  let result = value.normalize('NFC').replace(INVISIBLE_CHARACTERS, '')
  for (const [pattern, replacement] of SMART_PUNCTUATION) {
    result = result.replace(pattern, replacement)
  }
  return result.trim()
}

// Assumes value is already sanitized. Check order mirrors CGW.
export const validateName = (value: string, opts?: { minLength?: number; maxLength?: number }): string | undefined => {
  const min = opts?.minLength ?? NAME_MIN_LENGTH
  const max = opts?.maxLength ?? NAME_MAX_LENGTH
  const length = [...value].length // code points

  if (length === 0 && min > 0) return EMPTY_NAME_MESSAGE
  if (!ALLOWED_NAME_REGEX.test(value)) return DISALLOWED_CHARACTER_MESSAGE
  if (length > 0 && length < min) return `Names must be at least ${min} character(s) long`
  if (length > max) return `Names must be at most ${max} characters long`

  return undefined
}
