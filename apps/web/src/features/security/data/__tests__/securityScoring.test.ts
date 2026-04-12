import {
  calculateClearRatio,
  calculateScore,
  getGrade,
  getGradeColor,
  getStrengthLevel,
  getStrengthColor,
} from '../securityScoring'
import type { DimensionResult } from '../securityTypes'

const makeDimension = (status: 'clear' | 'issue' | 'partial'): DimensionResult => ({ status }) as DimensionResult

describe('securityScoring', () => {
  describe('calculateClearRatio', () => {
    it('returns 0 for empty array', () => {
      expect(calculateClearRatio([])).toBe(0)
    })

    it('returns 1 for all clear', () => {
      const dims = [makeDimension('clear'), makeDimension('clear'), makeDimension('clear')]
      expect(calculateClearRatio(dims)).toBe(1)
    })

    it('returns 0 for no clear', () => {
      const dims = [makeDimension('issue'), makeDimension('partial')]
      expect(calculateClearRatio(dims)).toBe(0)
    })

    it('returns correct ratio for mixed results', () => {
      const dims = [makeDimension('clear'), makeDimension('issue'), makeDimension('clear'), makeDimension('partial')]
      expect(calculateClearRatio(dims)).toBe(0.5)
    })
  })

  describe('calculateScore', () => {
    it('converts ratio to percentage', () => {
      expect(calculateScore(0.75)).toBe(75)
      expect(calculateScore(1)).toBe(100)
      expect(calculateScore(0)).toBe(0)
    })
  })

  describe('getGrade', () => {
    it('returns Low for >= 0.83', () => {
      expect(getGrade(0.83)).toBe('Low')
      expect(getGrade(1)).toBe('Low')
    })

    it('returns Medium for >= 0.5', () => {
      expect(getGrade(0.5)).toBe('Medium')
      expect(getGrade(0.82)).toBe('Medium')
    })

    it('returns High for >= 0.17', () => {
      expect(getGrade(0.17)).toBe('High')
      expect(getGrade(0.49)).toBe('High')
    })

    it('returns Critical for < 0.17', () => {
      expect(getGrade(0.16)).toBe('Critical')
      expect(getGrade(0)).toBe('Critical')
    })
  })

  describe('getGradeColor', () => {
    it('returns color for each grade', () => {
      expect(getGradeColor('Low')).toBe('success.main')
      expect(getGradeColor('Medium')).toBe('warning.main')
      expect(getGradeColor('High')).toBe('error.main')
      expect(getGradeColor('Critical')).toBe('error.main')
    })
  })

  describe('getStrengthLevel', () => {
    it('returns Strong for >= 0.83', () => {
      expect(getStrengthLevel(1)).toBe('Strong')
      expect(getStrengthLevel(0.83)).toBe('Strong')
    })

    it('returns Moderate for >= 0.5', () => {
      expect(getStrengthLevel(0.5)).toBe('Moderate')
    })

    it('returns Weak for >= 0.17', () => {
      expect(getStrengthLevel(0.2)).toBe('Weak')
    })

    it('returns Critical for < 0.17', () => {
      expect(getStrengthLevel(0)).toBe('Critical')
    })

    it('caps at Weak when hasCriticalIssue is true and ratio is Strong', () => {
      expect(getStrengthLevel(1, true)).toBe('Weak')
      expect(getStrengthLevel(0.9, true)).toBe('Weak')
    })

    it('caps at Weak when hasCriticalIssue is true and ratio is Moderate', () => {
      expect(getStrengthLevel(0.6, true)).toBe('Weak')
    })

    it('does not change Weak or Critical when hasCriticalIssue is true', () => {
      expect(getStrengthLevel(0.2, true)).toBe('Weak')
      expect(getStrengthLevel(0, true)).toBe('Critical')
    })
  })

  describe('getStrengthColor', () => {
    it('returns color for each level', () => {
      expect(getStrengthColor('Strong')).toBe('success.main')
      expect(getStrengthColor('Moderate')).toBe('warning.main')
      expect(getStrengthColor('Weak')).toBe('error.main')
      expect(getStrengthColor('Critical')).toBe('error.main')
    })
  })
})
