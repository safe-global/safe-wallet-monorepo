import { getScoreBand, GRADE_RAMP } from '../scoreBands'

describe('scoreBands', () => {
  describe('getScoreBand', () => {
    it('maps each score range to its band', () => {
      expect(getScoreBand(100).band).toBe('healthy')
      expect(getScoreBand(90).band).toBe('healthy')
      expect(getScoreBand(89).band).toBe('good')
      expect(getScoreBand(85).band).toBe('good')
      expect(getScoreBand(84).band).toBe('review')
      expect(getScoreBand(60).band).toBe('review')
      expect(getScoreBand(59).band).toBe('at_risk')
      expect(getScoreBand(40).band).toBe('at_risk')
      expect(getScoreBand(39).band).toBe('critical')
      expect(getScoreBand(0).band).toBe('critical')
    })

    it('clamps below 0 to the critical band', () => {
      expect(getScoreBand(-10).band).toBe('critical')
    })

    it('returns the ramp colour for the matched band', () => {
      expect(getScoreBand(95).color).toBe('success.main')
      expect(getScoreBand(87).color).toBe('score.good')
      expect(getScoreBand(70).color).toBe('score.review')
      expect(getScoreBand(50).color).toBe('warning.main')
      expect(getScoreBand(10).color).toBe('error.main')
    })

    describe('hasCriticalIssue clamp', () => {
      it('caps healthy/good/review scores at "At risk"', () => {
        expect(getScoreBand(100, true).band).toBe('at_risk')
        expect(getScoreBand(87, true).band).toBe('at_risk')
        expect(getScoreBand(70, true).band).toBe('at_risk')
      })

      it('leaves at_risk and critical scores unchanged', () => {
        expect(getScoreBand(50, true).band).toBe('at_risk')
        expect(getScoreBand(10, true).band).toBe('critical')
      })
    })
  })

  describe('GRADE_RAMP', () => {
    it('is ordered best → worst with descending lower bounds', () => {
      const mins = GRADE_RAMP.map((b) => b.min)
      expect(mins).toEqual([...mins].sort((a, b) => b - a))
      expect(GRADE_RAMP[GRADE_RAMP.length - 1].min).toBe(0)
    })
  })
})
