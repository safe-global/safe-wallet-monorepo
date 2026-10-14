/**
 * Client-side mirror of the gateway's tag rules so the picker can reject a bad tag before the
 * request. The gateway remains the authority; these only shape the UI feedback.
 */
export const TAG_MAX_LENGTH = 32
export const MAX_TAGS_PER_CONTACT = 10

const ALLOWED_TAG = /^[\p{L}\p{M}\p{N} \-_&/]+$/u
const FORBIDDEN_PREFIX = /^[=+\-@]/

export const TAGS_DISCLAIMER = 'Tags are labels your team writes. They are not a verification.'

export const validateTag = (raw: string): string | undefined => {
  const tag = raw.trim()
  if (tag.length === 0) return 'Tags cannot be empty'
  if (FORBIDDEN_PREFIX.test(tag)) return 'Tags cannot start with =, +, - or @'
  if (!ALLOWED_TAG.test(tag)) return 'Tags can only contain letters, numbers, spaces and the characters - _ & /'
  if ([...tag].length > TAG_MAX_LENGTH) return `Tags must be at most ${TAG_MAX_LENGTH} characters long`
  return undefined
}

/** Case-insensitive dedupe that keeps the first spelling, matching the gateway. */
export const dedupeTags = (tags: string[]): string[] => {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of tags) {
    const tag = raw.trim()
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) continue
    seen.add(key)
    result.push(tag)
  }
  return result
}

const sameTag = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export const hasTag = (tags: readonly string[], tag: string): boolean => tags.some((t) => sameTag(t, tag))

/** `tags` minus every tag in `remove`, case-insensitively. */
export const withoutTags = (tags: readonly string[], remove: readonly string[]): string[] =>
  tags.filter((tag) => !hasTag(remove, tag))

/** Tags present on every list, case-insensitively, spelled as in the first list. */
export const commonTags = (lists: readonly (readonly string[])[]): string[] => {
  if (lists.length === 0) return []
  return lists[0].filter((tag) => lists.every((list) => hasTag(list, tag)))
}
