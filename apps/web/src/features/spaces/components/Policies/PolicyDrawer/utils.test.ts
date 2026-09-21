import { getPolicyStatusColor, getPolicyStatusLabel } from './utils'
import { PolicyStatus } from './variants/types'

describe('PolicyDrawer utils', () => {
  describe('getPolicyStatusLabel', () => {
    it.each([
      [PolicyStatus.ACTIVE, 'Active'],
      [PolicyStatus.PENDING, 'Pending'],
      [PolicyStatus.NOT_ACTIVATED, 'Not activated'],
    ])('returns the sentence-case label for %s', (status, label) => {
      expect(getPolicyStatusLabel(status)).toBe(label)
    })
  })

  describe('getPolicyStatusColor', () => {
    it.each([
      [PolicyStatus.ACTIVE, 'success'],
      [PolicyStatus.PENDING, 'warning'],
      [PolicyStatus.NOT_ACTIVATED, 'destructive'],
    ])('returns the badge variant for %s', (status, color) => {
      expect(getPolicyStatusColor(status)).toBe(color)
    })
  })
})
