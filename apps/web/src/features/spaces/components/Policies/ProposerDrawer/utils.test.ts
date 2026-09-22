import { getProposerStatusColor, getProposerStatusLabel } from './utils'
import { ProposerStatus } from './variants/types'

describe('ProposerDrawer utils', () => {
  describe('getProposerStatusLabel', () => {
    it.each([
      [ProposerStatus.ACTIVE, 'Active'],
      [ProposerStatus.PENDING, 'Pending'],
      [ProposerStatus.NOT_ACTIVATED, 'Not activated'],
    ])('returns the sentence-case label for %s', (status, label) => {
      expect(getProposerStatusLabel(status)).toBe(label)
    })
  })

  describe('getProposerStatusColor', () => {
    it.each([
      [ProposerStatus.ACTIVE, 'success'],
      [ProposerStatus.PENDING, 'warning'],
      [ProposerStatus.NOT_ACTIVATED, 'destructive'],
    ])('returns the badge variant for %s', (status, color) => {
      expect(getProposerStatusColor(status)).toBe(color)
    })
  })
})
