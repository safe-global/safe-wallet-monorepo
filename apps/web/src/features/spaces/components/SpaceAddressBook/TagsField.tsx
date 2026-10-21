import { Controller, useFormContext } from 'react-hook-form'
import TagPicker from '@safe-global/views/features/spaces/components/AddressBookV2/tags/TagPicker'
import { TagChips } from '@safe-global/views/features/spaces/components/AddressBookV2/tags/TagChip'
import type { WorkspaceTag } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import { TAGS_DISCLAIMER } from '@safe-global/views/features/spaces/components/AddressBookV2/tags/tagRules'
import type { ContactField } from './AddContactDialog'

type TagsFieldProps = {
  workspaceTags: WorkspaceTag[]
  onLimitReached?: () => void
}

/** The contact's tags in the Add and Edit contact forms. */
const TagsField = ({ workspaceTags, onLimitReached }: TagsFieldProps) => {
  const { control } = useFormContext<ContactField>()

  return (
    <div>
      <p className="mb-1 text-sm font-bold">Tags</p>
      <p className="text-muted-foreground mb-2 text-sm">{TAGS_DISCLAIMER}</p>
      <Controller
        name="tags"
        control={control}
        render={({ field }) => (
          <div className="flex flex-wrap items-center gap-2">
            <TagPicker
              value={field.value}
              onChange={field.onChange}
              workspaceTags={workspaceTags}
              onLimitReached={onLimitReached}
            />
            <TagChips tags={field.value} />
          </div>
        )}
      />
    </div>
  )
}

export default TagsField
