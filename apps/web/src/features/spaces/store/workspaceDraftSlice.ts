import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MemberRole } from '../memberRole'
import type { RootState } from '@/store'

export const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export type DraftSafe = { chainId: string; address: string }

/** An invite as typed: an email, an address, or an ENS name until it resolves. */
export type DraftInvite = { identifier: string; role: MemberRole }

/** The Workspace onboarding form, kept across the Stripe round trip and page reloads. */
export type WorkspaceDraft = {
  /** The CGW user who filled it in; another user never sees it. */
  ownerId: number | null
  updatedAt: number | null
  name: string
  paymentLinkId: string | null
  safes: DraftSafe[]
  /** Names for new Safes, keyed by address in lower case, so one name covers every chain. */
  safeNames: Record<string, string>
  invites: DraftInvite[]
  /** Survey answers by page ID, as the survey response stores them. */
  surveySelections: Record<string, string[]>
  /** Set once the Workspace exists; the next submit replaces its pending setup instead of creating another. */
  createdSpaceId: string | null
}

export type WorkspaceDraftFields = Omit<WorkspaceDraft, 'ownerId' | 'updatedAt'>

export const EMPTY_WORKSPACE_DRAFT: WorkspaceDraft = {
  ownerId: null,
  updatedAt: null,
  name: '',
  paymentLinkId: null,
  safes: [],
  safeNames: {},
  invites: [],
  surveySelections: {},
  createdSpaceId: null,
}

type DraftChange = { ownerId: number; changes: Partial<WorkspaceDraftFields>; updatedAt: number }

export const workspaceDraftSlice = createSlice({
  name: 'workspaceDraft',
  initialState: EMPTY_WORKSPACE_DRAFT,
  reducers: {
    updateWorkspaceDraft: {
      reducer: (state, { payload }: PayloadAction<DraftChange>) => {
        const base = state.ownerId === payload.ownerId ? state : EMPTY_WORKSPACE_DRAFT
        return { ...base, ...payload.changes, ownerId: payload.ownerId, updatedAt: payload.updatedAt }
      },
      prepare: (ownerId: number, changes: Partial<WorkspaceDraftFields>) => ({
        payload: { ownerId, changes, updatedAt: Date.now() },
      }),
    },
    clearWorkspaceDraft: () => EMPTY_WORKSPACE_DRAFT,
  },
})

export const { updateWorkspaceDraft, clearWorkspaceDraft } = workspaceDraftSlice.actions

/** A draft counts only for its owner and only while it is fresh; anything else reads as an empty form. */
export const usableDraft = (draft: WorkspaceDraft, ownerId: number | undefined, now: number): WorkspaceDraft => {
  const isOwn = ownerId !== undefined && draft.ownerId === ownerId
  const isFresh = draft.updatedAt !== null && now - draft.updatedAt < DRAFT_MAX_AGE_MS
  return isOwn && isFresh ? draft : EMPTY_WORKSPACE_DRAFT
}

export const selectStoredWorkspaceDraft = (state: RootState): WorkspaceDraft =>
  state[workspaceDraftSlice.name] ?? EMPTY_WORKSPACE_DRAFT
