import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['community'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      communityGetCampaignsV1: build.query<CommunityGetCampaignsV1ApiResponse, CommunityGetCampaignsV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/community/campaigns`,
          params: {
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['community'],
      }),
      communityGetCampaignByIdV1: build.query<CommunityGetCampaignByIdV1ApiResponse, CommunityGetCampaignByIdV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/community/campaigns/${queryArg.resourceId}` }),
        providesTags: ['community'],
      }),
      communityGetCampaignActivitiesV1: build.query<
        CommunityGetCampaignActivitiesV1ApiResponse,
        CommunityGetCampaignActivitiesV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/community/campaigns/${queryArg.resourceId}/activities`,
          params: {
            holder: queryArg.holder,
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['community'],
      }),
      communityGetCampaignLeaderboardV1: build.query<
        CommunityGetCampaignLeaderboardV1ApiResponse,
        CommunityGetCampaignLeaderboardV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/community/campaigns/${queryArg.resourceId}/leaderboard`,
          params: {
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['community'],
      }),
      communityGetCampaignRankV1: build.query<CommunityGetCampaignRankV1ApiResponse, CommunityGetCampaignRankV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/community/campaigns/${queryArg.resourceId}/leaderboard/${queryArg.safeAddress}`,
        }),
        providesTags: ['community'],
      }),
      communityCheckEligibilityV1: build.mutation<
        CommunityCheckEligibilityV1ApiResponse,
        CommunityCheckEligibilityV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/community/eligibility`, method: 'POST', body: queryArg.eligibilityRequest }),
        invalidatesTags: ['community'],
      }),
      communityGetLeaderboardV1: build.query<CommunityGetLeaderboardV1ApiResponse, CommunityGetLeaderboardV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/community/locking/leaderboard`,
          params: {
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['community'],
      }),
      communityGetLockingRankV1: build.query<CommunityGetLockingRankV1ApiResponse, CommunityGetLockingRankV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/community/locking/${queryArg.safeAddress}/rank` }),
        providesTags: ['community'],
      }),
      communityGetLockingHistoryV1: build.query<
        CommunityGetLockingHistoryV1ApiResponse,
        CommunityGetLockingHistoryV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/community/locking/${queryArg.safeAddress}/history`,
          params: {
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['community'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type CommunityGetCampaignsV1ApiResponse = /** status 200  */ CampaignPage
export type CommunityGetCampaignsV1ApiArg = {
  cursor?: string
}
export type CommunityGetCampaignByIdV1ApiResponse = /** status 200  */ Campaign
export type CommunityGetCampaignByIdV1ApiArg = {
  resourceId: string
}
export type CommunityGetCampaignActivitiesV1ApiResponse = unknown
export type CommunityGetCampaignActivitiesV1ApiArg = {
  resourceId: string
  holder?: string
  cursor?: string
}
export type CommunityGetCampaignLeaderboardV1ApiResponse = /** status 200  */ CampaignRankPage
export type CommunityGetCampaignLeaderboardV1ApiArg = {
  resourceId: string
  cursor?: string
}
export type CommunityGetCampaignRankV1ApiResponse = /** status 200  */ CampaignRank
export type CommunityGetCampaignRankV1ApiArg = {
  resourceId: string
  safeAddress: string
}
export type CommunityCheckEligibilityV1ApiResponse = /** status 200  */ Eligibility
export type CommunityCheckEligibilityV1ApiArg = {
  eligibilityRequest: EligibilityRequest
}
export type CommunityGetLeaderboardV1ApiResponse = /** status 200  */ LockingRankPage
export type CommunityGetLeaderboardV1ApiArg = {
  cursor?: string
}
export type CommunityGetLockingRankV1ApiResponse = /** status 200  */ LockingRank
export type CommunityGetLockingRankV1ApiArg = {
  safeAddress: string
}
export type CommunityGetLockingHistoryV1ApiResponse = /** status 200  */ LockingEventPage
export type CommunityGetLockingHistoryV1ApiArg = {
  safeAddress: string
  cursor?: string
}
export type ActivityMetadata = {
  name: string
  description: string
  maxPoints: number
}
export type Campaign = {
  resourceId: string
  name: string
  description: string
  startDate: string
  endDate: string
  lastUpdated?: string | null
  activitiesMetadata?: ActivityMetadata[] | null
  rewardValue?: string | null
  rewardText?: string | null
  iconUrl?: string | null
  safeAppUrl?: string | null
  partnerUrl?: string | null
  isPromoted: boolean
}
export type CampaignPage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: Campaign[]
}
export type CampaignRank = {
  holder: string
  position: number
  boost: number
  totalPoints: number
  totalBoostedPoints: number
}
export type CampaignRankPage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: CampaignRank[]
}
export type Eligibility = {
  requestId: string
  isAllowed: boolean
  isVpn: boolean
}
export type EligibilityRequest = {
  requestId: string
  sealedData: string
}
export type LockingRank = {
  holder: string
  position: number
  lockedAmount: string
  unlockedAmount: string
  withdrawnAmount: string
}
export type LockingRankPage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: LockingRank[]
}
export type LockEventItem = {
  eventType: 'LOCKED'
  executionDate: string
  transactionHash: string
  holder: string
  amount: string
  logIndex: string
}
export type UnlockEventItem = {
  eventType: 'UNLOCKED'
  executionDate: string
  transactionHash: string
  holder: string
  amount: string
  logIndex: string
  unlockIndex: string
}
export type WithdrawEventItem = {
  eventType: 'WITHDRAWN'
  executionDate: string
  transactionHash: string
  holder: string
  amount: string
  logIndex: string
  unlockIndex: string
}
export type LockingEventPage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: (LockEventItem | UnlockEventItem | WithdrawEventItem)[]
}
export const {
  useCommunityGetCampaignsV1Query,
  useLazyCommunityGetCampaignsV1Query,
  useCommunityGetCampaignByIdV1Query,
  useLazyCommunityGetCampaignByIdV1Query,
  useCommunityGetCampaignActivitiesV1Query,
  useLazyCommunityGetCampaignActivitiesV1Query,
  useCommunityGetCampaignLeaderboardV1Query,
  useLazyCommunityGetCampaignLeaderboardV1Query,
  useCommunityGetCampaignRankV1Query,
  useLazyCommunityGetCampaignRankV1Query,
  useCommunityCheckEligibilityV1Mutation,
  useCommunityGetLeaderboardV1Query,
  useLazyCommunityGetLeaderboardV1Query,
  useCommunityGetLockingRankV1Query,
  useLazyCommunityGetLockingRankV1Query,
  useCommunityGetLockingHistoryV1Query,
  useLazyCommunityGetLockingHistoryV1Query,
} = injectedRtkApi
