import { faker } from '@faker-js/faker'
import { EMPTY_WORKSPACE_DRAFT, type WorkspaceDraft } from '@/features/spaces/store'
import { Builder, type IBuilder } from '../Builder'

/** A name the Workspace name rules accept (3–30 letters). */
export const fakeWorkspaceName = (): string => faker.string.alpha({ length: { min: 3, max: 30 } })

/** The CGW ID of a user. */
export const fakeUserId = (): number => faker.number.int({ min: 1, max: 100_000 })

/** An empty onboarding draft that belongs to a signed-in user and was saved just now. */
export function workspaceDraftBuilder(): IBuilder<WorkspaceDraft> {
  return Builder.new<WorkspaceDraft>().with({
    ...EMPTY_WORKSPACE_DRAFT,
    ownerId: fakeUserId(),
    updatedAt: Date.now(),
  })
}
