import type { AddressBookContact } from '../types'

/**
 * Tags the app adds on its own, from workspace data. Nobody can add, rename or remove them, and
 * they don't count towards the tag limits.
 */
export const WORKSPACE_SAFE_TAG = 'Workspace Safe'
export const SIGNER_TAG = 'Signer of a Safe'

export const SYSTEM_TAGS = [WORKSPACE_SAFE_TAG, SIGNER_TAG] as const

export const isSystemTag = (tag: string): boolean =>
  SYSTEM_TAGS.some((systemTag) => systemTag.toLowerCase() === tag.trim().toLowerCase())

type TaggedContact = Pick<AddressBookContact, 'isWorkspaceSafe' | 'signerOf' | 'tags'>

export const systemTagsOf = (contact: Pick<TaggedContact, 'isWorkspaceSafe' | 'signerOf'>): string[] => [
  ...(contact.isWorkspaceSafe ? [WORKSPACE_SAFE_TAG] : []),
  ...(contact.signerOf.length > 0 ? [SIGNER_TAG] : []),
]

/** Automatic tags first, then the team's. */
export const allTagsOf = (contact: TaggedContact): string[] => [...systemTagsOf(contact), ...contact.tags]

/** What hovering an automatic tag explains. */
export const systemTagTitles = (contact: Pick<TaggedContact, 'signerOf'>): Record<string, string> => ({
  [WORKSPACE_SAFE_TAG]: 'One of this workspace’s Safes. Added automatically.',
  [SIGNER_TAG]: `Signer of ${contact.signerOf.join(', ')}. Added automatically.`,
})
