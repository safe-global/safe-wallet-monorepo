import { toPolicyStatus } from './utils'
import { ProposerStatus } from './variants/types'

describe('toPolicyStatus', () => {
  it.each([
    [ProposerStatus.ACTIVE, 'active'],
    [ProposerStatus.PENDING, 'pending'],
    [ProposerStatus.NOT_ACTIVATED, 'not-activated'],
  ])('reads %s as its policy status', (status, policyStatus) => {
    expect(toPolicyStatus(status)).toBe(policyStatus)
  })
})
