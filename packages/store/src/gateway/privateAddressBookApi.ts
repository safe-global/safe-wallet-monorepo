/**
 * Manually injected RTK Query endpoints for private address book and requests.
 * These will be replaced by AUTO_GENERATED hooks once the CGW schema is updated.
 */
import { cgwApi as api } from './AUTO_GENERATED/spaces'
import type { SpaceAddressBookDto, UpsertAddressBookItemsDto } from './AUTO_GENERATED/spaces'

export type AddressBookRequestItemDto = {
  id: number
  name: string
  address: string
  chainIds: string[]
  requestedBy: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
}

export type AddressBookRequestsDto = {
  spaceId: string
  data: AddressBookRequestItemDto[]
}

const injectedApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Private address book CRUD
    getPrivateAddressBook: build.query<SpaceAddressBookDto, { spaceId: number }>({
      query: ({ spaceId }) => ({ url: `/v1/spaces/${spaceId}/address-book/private` }),
      providesTags: ['spaces'],
    }),
    upsertPrivateAddressBook: build.mutation<SpaceAddressBookDto, { spaceId: number; body: UpsertAddressBookItemsDto }>(
      {
        query: ({ spaceId, body }) => ({
          url: `/v1/spaces/${spaceId}/address-book/private`,
          method: 'PUT',
          body,
        }),
        invalidatesTags: ['spaces'],
      },
    ),
    deletePrivateContact: build.mutation<void, { spaceId: number; address: string }>({
      query: ({ spaceId, address }) => ({
        url: `/v1/spaces/${spaceId}/address-book/private/${address}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['spaces'],
    }),

    // Address book requests
    getAddressBookRequests: build.query<AddressBookRequestsDto, { spaceId: number }>({
      query: ({ spaceId }) => ({ url: `/v1/spaces/${spaceId}/address-book/requests` }),
      providesTags: ['spaces'],
    }),
    createAddressBookRequest: build.mutation<AddressBookRequestItemDto, { spaceId: number; address: string }>({
      query: ({ spaceId, address }) => ({
        url: `/v1/spaces/${spaceId}/address-book/requests`,
        method: 'POST',
        body: { address },
      }),
      invalidatesTags: ['spaces'],
    }),
    approveAddressBookRequest: build.mutation<void, { spaceId: number; requestId: number }>({
      query: ({ spaceId, requestId }) => ({
        url: `/v1/spaces/${spaceId}/address-book/requests/${requestId}/approve`,
        method: 'PUT',
      }),
      invalidatesTags: ['spaces'],
    }),
    rejectAddressBookRequest: build.mutation<void, { spaceId: number; requestId: number }>({
      query: ({ spaceId, requestId }) => ({
        url: `/v1/spaces/${spaceId}/address-book/requests/${requestId}/reject`,
        method: 'PUT',
      }),
      invalidatesTags: ['spaces'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetPrivateAddressBookQuery,
  useUpsertPrivateAddressBookMutation,
  useDeletePrivateContactMutation,
  useGetAddressBookRequestsQuery,
  useCreateAddressBookRequestMutation,
  useApproveAddressBookRequestMutation,
  useRejectAddressBookRequestMutation,
} = injectedApi
