import { getGrade, getGradeColor } from '../securityScoring'

describe('securityScoring', () => {
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
      expect(getGradeColor('Medium')).toBe('score.review')
      expect(getGradeColor('High')).toBe('warning.main')
      expect(getGradeColor('Critical')).toBe('error.main')
    })
  })
})
