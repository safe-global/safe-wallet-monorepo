import { faker } from '@faker-js/faker'
import { formatDate, getInvitedByName } from './utils'
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

describe('formatDate', () => {
  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('')
  })

  it('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('')
  })

  it('formats today as "Today at HH:MM"', () => {
    const now = new Date()
    const result = formatDate(now.toISOString())
    expect(result).toMatch(/^Today at /)
  })

  it('formats yesterday as "Yesterday at HH:MM"', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const result = formatDate(yesterday.toISOString())
    expect(result).toMatch(/^Yesterday at /)
  })

  it('formats older dates as "Mon DD at HH:MM"', () => {
    const result = formatDate('2025-01-15T10:30:00Z')
    expect(result).toMatch(/at /)
    expect(result).not.toMatch(/^Today/)
    expect(result).not.toMatch(/^Yesterday/)
  })
})
