import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import {
  useAddressBooksCreateTagV1Mutation,
  useAddressBooksDeleteTagV1Mutation,
  useAddressBooksRenameTagV1Mutation,
  useAddressBooksSetContactTagsV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  normalizeTagName,
  sameTagName,
  validateTagName,
} from '@safe-global/views/features/spaces/components/AddressBookV2/tags/tagRules'
import type { WorkspaceTag } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import type { TagActions } from '@safe-global/views/features/spaces/components/AddressBookV2/tags/TagSelect'
import { useCurrentSpaceId } from '@/features/spaces'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'

type Outcome = { error?: unknown }

/** Undefined when the request went through or is waiting for step-up, which redirects on its own. */
const errorMessageOf = ({ error }: Outcome): string | undefined =>
  error && !isElevationRequiredError(error)
    ? getRtkQueryErrorMessage(error as FetchBaseQueryError | SerializedError)
    : undefined

const useTagActions = () => {
  const spaceId = useCurrentSpaceId() ?? ''
  const dispatch = useAppDispatch()
  const [setContactTags, { isLoading: isSavingContactTags }] = useAddressBooksSetContactTagsV1Mutation()
  const [createTagMutation] = useAddressBooksCreateTagV1Mutation()
  const [renameTagMutation] = useAddressBooksRenameTagV1Mutation()
  const [deleteTagMutation] = useAddressBooksDeleteTagV1Mutation()

  const saveContactTags = async (address: string, tags: string[]): Promise<{ saved: boolean; error?: string }> => {
    const result = await setContactTags({ spaceId, setContactTagsDto: { items: [{ address, tags }] } })
    if (result.error) return { saved: false, error: errorMessageOf(result) }
    dispatch(showNotification({ message: 'Tags updated', variant: 'success', groupKey: 'update-tags-success' }))
    return { saved: true }
  }

  const createTag = async (rawName: string): Promise<{ tag?: WorkspaceTag; error?: string }> => {
    const error = validateTagName(rawName)
    if (error) return { error }
    const name = normalizeTagName(rawName)

    const result = await createTagMutation({ spaceId, createTagDto: { name } })
    if (result.error) return { error: errorMessageOf(result) }
    return { tag: result.data.tags.find((candidate) => sameTagName(candidate.name, name)) }
  }

  /** `mergedIntoId` is the existing tag a rename to its name merged into. */
  const renameTag = async (tag: WorkspaceTag, rawName: string): Promise<{ error?: string; mergedIntoId?: number }> => {
    const error = validateTagName(rawName)
    if (error) return { error }
    const name = normalizeTagName(rawName)
    if (name === tag.name) return {}

    const result = await renameTagMutation({ spaceId, tagId: tag.id, renameTagDto: { name } })
    if (result.error) return { error: errorMessageOf(result) }
    if (result.data.tags.some((candidate) => candidate.id === tag.id)) return {}
    return { mergedIntoId: result.data.tags.find((candidate) => sameTagName(candidate.name, name))?.id }
  }

  const deleteTag = async (tag: WorkspaceTag): Promise<void> => {
    const result = await deleteTagMutation({ spaceId, tagId: tag.id })
    const message = errorMessageOf(result)
    if (message) dispatch(showNotification({ message, variant: 'error', groupKey: 'delete-tag-error' }))
  }

  const tagActions: TagActions = { onCreate: createTag, onRename: renameTag, onDelete: deleteTag }

  return { saveContactTags, isSavingContactTags, createTag, renameTag, deleteTag, tagActions }
}

export default useTagActions
