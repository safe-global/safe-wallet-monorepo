import { systemTagsOf, systemTagTitles } from './systemTags'
import { TagChip } from './TagChip'
import type { AddressBookContact } from '../types'

/** The Type column: "Workspace Safe" and "Signer", stacked. Set by the app, never by a member. */
const AutomaticLabels = ({ contact }: { contact: Pick<AddressBookContact, 'isWorkspaceSafe' | 'signerOf'> }) => {
  const labels = systemTagsOf(contact)
  if (labels.length === 0) return null
  const titles = systemTagTitles(contact)

  return (
    <span className="inline-flex flex-col items-start gap-1" data-testid="automatic-labels">
      {labels.map((label) => (
        <TagChip key={label} tag={label} title={titles[label]} />
      ))}
    </span>
  )
}

export default AutomaticLabels
