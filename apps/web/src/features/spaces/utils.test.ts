import { faker } from '@faker-js/faker'
import { getInvitedByName, isUnauthorized } from './utils'
import { spaceBuilder, spaceMemberBuilder } from '@/tests/builders/space'

const CURRENT_USER_ID = 1

const buildSpaceWithMember = (invitedByName?: string) =>
  spaceBuilder()
    .with({
      members: [
        spaceMemberBuilder()
          .with({ user: { id: CURRENT_USER_ID }, invitedByName })
          .build(),
      ],
    })
    .build()

describe('isUnauthorized', () => {
  it('treats a 400 (legacy numeric space id rejected by the backend) as unauthorized', () => {
    expect(isUnauthorized({ status: 400, data: undefined })).toBe(true)
  })

  it('treats a 401 as unauthorized', () => {
    expect(isUnauthorized({ status: 401, data: undefined })).toBe(true)
  })

  it('treats a 404 as unauthorized', () => {
    expect(isUnauthorized({ status: 404, data: undefined })).toBe(true)
  })

  it('does not treat a 500 as unauthorized', () => {
    expect(isUnauthorized({ status: 500, data: undefined })).toBe(false)
  })

  it('returns falsy when there is no error', () => {
    expect(isUnauthorized(undefined)).toBeFalsy()
  })
})

describe('getInvitedByName', () => {
  it('returns undefined when no space is provided', () => {
    expect(getInvitedByName(undefined, CURRENT_USER_ID)).toBeUndefined()
  })

  it('returns invitedByName for the matching member', () => {
    const email = faker.internet.email()
    expect(getInvitedByName(buildSpaceWithMember(email), CURRENT_USER_ID)).toBe(email)
  })

  it('returns undefined when the current user is not a member', () => {
    expect(getInvitedByName(buildSpaceWithMember(faker.internet.email()), 999)).toBeUndefined()
  })

  it('returns undefined when there is no current user id', () => {
    expect(getInvitedByName(buildSpaceWithMember(faker.internet.email()), undefined)).toBeUndefined()
  })

  it('returns undefined when the member has no inviter name', () => {
    expect(getInvitedByName(buildSpaceWithMember(undefined), CURRENT_USER_ID)).toBeUndefined()
  })
})
