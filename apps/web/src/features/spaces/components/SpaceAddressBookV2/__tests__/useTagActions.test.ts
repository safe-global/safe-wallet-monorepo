import { renderHook } from '@testing-library/react'
import { spaceAddressBookTagBuilder } from '@/tests/builders/space'
import useTagActions from '../useTagActions'

const SPACE_ID = '7'
const mockDispatch = jest.fn()
const mockSetContactTags = jest.fn()
const mockCreateTag = jest.fn()
const mockRenameTag = jest.fn()
const mockDeleteTag = jest.fn()
const elevationRequired = { status: 403, data: { code: 'elevation_required' } }

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBooksSetContactTagsV1Mutation: () => [mockSetContactTags, { isLoading: false }],
  useAddressBooksCreateTagV1Mutation: () => [mockCreateTag],
  useAddressBooksRenameTagV1Mutation: () => [mockRenameTag],
  useAddressBooksDeleteTagV1Mutation: () => [mockDeleteTag],
}))
jest.mock('@/features/spaces', () => ({ useCurrentSpaceId: () => SPACE_ID }))
jest.mock('@/store', () => ({ useAppDispatch: () => mockDispatch }))
jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
}))
jest.mock('@/features/oidc-auth/utils/elevation', () => ({
  isElevationRequiredError: (error: unknown) => error === elevationRequired,
}))
jest.mock('@/utils/rtkQuery', () => ({
  getRtkQueryErrorMessage: (error: { data?: { message?: string } }) => error.data?.message ?? 'Something went wrong',
}))

const setup = () => renderHook(() => useTagActions()).result.current

describe('useTagActions', () => {
  const vendor = spaceAddressBookTagBuilder().with({ id: 1, name: 'Vendor' }).build()
  const internal = spaceAddressBookTagBuilder().with({ id: 2, name: 'Internal' }).build()

  beforeEach(() => jest.clearAllMocks())

  describe('saveContactTags', () => {
    it('sends the full set of tags for the contact and confirms', async () => {
      mockSetContactTags.mockResolvedValue({ data: {} })

      const result = await setup().saveContactTags('0xabc', ['Vendor'])

      expect(mockSetContactTags).toHaveBeenCalledWith({
        spaceId: SPACE_ID,
        setContactTagsDto: { items: [{ address: '0xabc', tags: ['Vendor'] }] },
      })
      expect(result).toEqual({ saved: true })
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ message: 'Tags updated' }) }),
      )
    })

    it('returns the error CGW gave', async () => {
      mockSetContactTags.mockResolvedValue({ error: { status: 422, data: { message: 'Too many tags' } } })

      expect(await setup().saveContactTags('0xabc', ['Vendor'])).toEqual({
        saved: false,
        error: 'Too many tags',
      })
    })

    it('shows no error while the request waits for step-up', async () => {
      mockSetContactTags.mockResolvedValue({ error: elevationRequired })

      expect(await setup().saveContactTags('0xabc', ['Vendor'])).toEqual({
        saved: false,
        error: undefined,
      })
    })
  })

  describe('createTag', () => {
    it('creates the tag with the normalized name and returns it', async () => {
      const created = spaceAddressBookTagBuilder().with({ name: 'Key vendors', contactCount: 0 }).build()
      mockCreateTag.mockResolvedValue({ data: { spaceUuid: SPACE_ID, data: [], tags: [vendor, created] } })

      const result = await setup().createTag('  Key   vendors ')

      expect(mockCreateTag).toHaveBeenCalledWith({ spaceId: SPACE_ID, createTagDto: { name: 'Key vendors' } })
      expect(result).toEqual({ tag: created })
    })

    it('explains an invalid name without a request', async () => {
      expect(await setup().createTag('=SUM(1)')).toEqual({ error: 'Tags cannot start with =, +, - or @' })
      expect(mockCreateTag).not.toHaveBeenCalled()
    })

    it('returns the error CGW gave, such as a name the workspace already has', async () => {
      mockCreateTag.mockResolvedValue({
        error: { status: 409, data: { message: 'A tag with this name already exists.' } },
      })

      expect(await setup().createTag('Vendor')).toEqual({ error: 'A tag with this name already exists.' })
    })

    it('shows no error while the request waits for step-up', async () => {
      mockCreateTag.mockResolvedValue({ error: elevationRequired })

      expect(await setup().createTag('Vendor')).toEqual({ error: undefined })
    })
  })

  describe('renameTag', () => {
    it('explains an invalid name without a request', async () => {
      expect(await setup().renameTag(vendor, 'Signer')).toEqual({
        error: "'Signer' is added automatically and can't be used as a tag name",
      })
      expect(mockRenameTag).not.toHaveBeenCalled()
    })

    it('sends nothing when the name is unchanged', async () => {
      expect(await setup().renameTag(vendor, '  Vendor ')).toEqual({})
      expect(mockRenameTag).not.toHaveBeenCalled()
    })

    it('sends the name as CGW stores it', async () => {
      mockRenameTag.mockResolvedValue({ data: { tags: [{ ...vendor, name: 'Key vendors' }, internal] } })

      expect(await setup().renameTag(vendor, ' Key   vendors ')).toEqual({})
      expect(mockRenameTag).toHaveBeenCalledWith({
        spaceId: SPACE_ID,
        tagId: vendor.id,
        renameTagDto: { name: 'Key vendors' },
      })
    })

    it('names the tag a rename merged into', async () => {
      mockRenameTag.mockResolvedValue({ data: { tags: [internal] } })

      expect(await setup().renameTag(vendor, 'internal')).toEqual({ mergedIntoId: internal.id })
    })

    it('returns the error CGW gave', async () => {
      mockRenameTag.mockResolvedValue({ error: { status: 404, data: { message: 'Tag not found' } } })

      expect(await setup().renameTag(vendor, 'Supplier')).toEqual({ error: 'Tag not found' })
    })
  })

  describe('deleteTag', () => {
    it('deletes the tag by id', async () => {
      mockDeleteTag.mockResolvedValue({ data: undefined })

      await setup().deleteTag(vendor)

      expect(mockDeleteTag).toHaveBeenCalledWith({ spaceId: SPACE_ID, tagId: vendor.id })
      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('reports a failed delete', async () => {
      mockDeleteTag.mockResolvedValue({ error: { status: 500, data: { message: 'Server error' } } })

      await setup().deleteTag(vendor)

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ message: 'Server error', variant: 'error' }) }),
      )
    })
  })
})
