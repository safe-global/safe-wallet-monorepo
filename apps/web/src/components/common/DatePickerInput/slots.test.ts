import { EMPTY_SLOTS, clearRange, slotAtTextIndex, slotsToText, textIndexAfterSlot, writeDigits } from './slots'

describe('date slots', () => {
  describe('slotsToText', () => {
    it.each([
      [EMPTY_SLOTS, ''],
      ['1_______', '1'],
      ['10______', '10'],
      ['101_____', '10/1'],
      ['1012____', '10/12'],
      ['10122___', '10/12/2'],
      ['10122025', '10/12/2025'],
      // an interior hole stays a hole, so a digit stream can never be re-read across it
      ['10__2025', '10/__/2025'],
      ['__122025', '__/12/2025'],
    ])('renders %s as "%s"', (slots, text) => {
      expect(slotsToText(slots)).toBe(text)
    })
  })

  describe('caret mapping', () => {
    it.each([
      [0, 0],
      [1, 1],
      [2, 2], // the separator after the day belongs to the month
      [3, 2],
      [4, 3],
      [5, 4], // the separator after the month belongs to the year
      [6, 4],
      [9, 7],
      [10, 8], // past the end
    ])('text index %i maps to slot %i', (textIndex, slot) => {
      expect(slotAtTextIndex(textIndex)).toBe(slot)
    })

    it.each([
      [0, 1],
      [1, 3], // skips the separator
      [2, 4],
      [3, 6], // skips the separator
      [7, 10],
    ])('caret after slot %i sits at text index %i', (slot, textIndex) => {
      expect(textIndexAfterSlot(slot)).toBe(textIndex)
    })
  })

  describe('writeDigits — overwrite, never insert', () => {
    it('changes the month without disturbing the day or year (the reported bug)', () => {
      // 10/12/2025, caret on the month's first slot, types 1 then 0
      let state = writeDigits('10122025', 2, '1')
      expect(slotsToText(state.slots)).toBe('10/12/2025')
      expect(state.caret).toBe(3)

      state = writeDigits(state.slots, state.caret, '0')
      expect(slotsToText(state.slots)).toBe('10/10/2025')
    })

    it('accepts both digits of a segment in one go', () => {
      const state = writeDigits('10122025', 2, '10')
      expect(slotsToText(state.slots)).toBe('10/10/2025')
      expect(state.caret).toBe(4)
    })

    it('overwrites a single digit in place', () => {
      const state = writeDigits('10122025', 7, '9')
      expect(slotsToText(state.slots)).toBe('10/12/2029')
    })

    it('fills progressively from empty', () => {
      const typed = ['1', '0', '1', '2', '2', '0', '2', '5']
      let slots = EMPTY_SLOTS
      let caret = 0
      const seen = typed.map((d) => {
        const next = writeDigits(slots, caret, d)
        slots = next.slots
        caret = next.caret
        return slotsToText(slots)
      })
      expect(seen).toEqual(['1', '10', '10/1', '10/12', '10/12/2', '10/12/20', '10/12/202', '10/12/2025'])
    })

    it('stops at the last slot instead of overflowing', () => {
      const state = writeDigits('10122025', 8, '9')
      expect(slotsToText(state.slots)).toBe('10/12/2025')
      expect(state.caret).toBe(8)
    })

    it('ignores anything that is not a digit', () => {
      const state = writeDigits('10122025', 2, 'x/')
      expect(slotsToText(state.slots)).toBe('10/12/2025')
      expect(state.caret).toBe(2)
    })
  })

  describe('clearRange', () => {
    it('leaves a hole rather than resequencing the digits', () => {
      // this is the case that used to turn 10//2025 into 10/20/25
      const state = clearRange('10122025', 2, 4)
      expect(slotsToText(state.slots)).toBe('10/__/2025')
      expect(state.caret).toBe(2)
    })

    it('clears a single slot for backspace', () => {
      const state = clearRange('10122025', 7, 8)
      expect(slotsToText(state.slots)).toBe('10/12/202')
      expect(state.caret).toBe(7)
    })

    it('empties the field when everything is cleared', () => {
      const state = clearRange('10122025', 0, 8)
      expect(state.slots).toBe(EMPTY_SLOTS)
      expect(slotsToText(state.slots)).toBe('')
    })
  })
})
