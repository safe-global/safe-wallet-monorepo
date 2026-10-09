/**
 * The date entry as eight fixed slots, `ddMMyyyy`, rather than a string being reparsed on every
 * keystroke. Typing overwrites the slot under the caret, so any part of a complete date can be
 * changed in place. A cleared slot stays a hole, which is what stops the remaining digits sliding
 * across it: clearing the month of `10/12/2025` gives `10/__/2025`, never `10/20/25`.
 */

const EMPTY = '_'
export const DATE_DIGITS = 8

/** Slots after which a `/` is rendered: `dd` / `MM` / `yyyy`. */
const SEPARATOR_AFTER = [1, 3]

export const EMPTY_SLOTS = EMPTY.repeat(DATE_DIGITS)

export type SlotState = { slots: string; caret: number }

const isFilled = (slot: string) => slot !== EMPTY

/** Renders up to the last filled slot, so a half-typed date reads `10/1` rather than `10/1_/____`. */
export const slotsToText = (slots: string): string => {
  const lastFilled = [...slots].reduce((last, slot, i) => (isFilled(slot) ? i : last), -1)
  if (lastFilled < 0) {
    return ''
  }

  return [...slots.slice(0, lastFilled + 1)]
    .map((slot, i) => (SEPARATOR_AFTER.includes(i) && i < lastFilled ? `${slot}/` : slot))
    .join('')
}

/** Text indices the `/` characters occupy. */
const SEPARATOR_INDEXES = SEPARATOR_AFTER.map((slot, i) => slot + i + 1)

/** The slot a caret sitting at `textIndex` will act on. A separator belongs to the segment after it. */
export const slotAtTextIndex = (textIndex: number): number =>
  Math.min(textIndex - SEPARATOR_INDEXES.filter((index) => textIndex > index).length, DATE_DIGITS)

/** Where the caret sits when it precedes `slot`. */
export const textIndexAtSlot = (slot: number): number =>
  slot + SEPARATOR_AFTER.filter((boundary) => slot > boundary).length

/** Where to put the caret so it sits just past `slot`. */
export const textIndexAfterSlot = (slot: number): number => textIndexAtSlot(slot + 1)

const replaceAt = (slots: string, index: number, char: string) => slots.slice(0, index) + char + slots.slice(index + 1)

/** Overwrites the slots from `caret` on. Non-digits are dropped; the eighth slot is the end. */
export const writeDigits = (slots: string, caret: number, input: string): SlotState =>
  [...input]
    .filter((char) => /\d/.test(char))
    .reduce<SlotState>(
      (state, digit) =>
        state.caret >= DATE_DIGITS
          ? state
          : { slots: replaceAt(state.slots, state.caret, digit), caret: state.caret + 1 },
      { slots, caret },
    )

/** Empties `[from, to)` in place, leaving holes. */
export const clearRange = (slots: string, from: number, to: number): SlotState => ({
  slots: [...slots].map((slot, i) => (i >= from && i < to ? EMPTY : slot)).join(''),
  caret: from,
})

/** Fills slots from an already-normalised `dd/MM/yyyy` string, for an outside value or a paste. */
export const textToSlots = (text: string): string => {
  const digits = text.replace(/\D/g, '').slice(0, DATE_DIGITS)
  return digits.padEnd(DATE_DIGITS, EMPTY)
}

/** A date only exists once every slot is filled. */
export const isComplete = (slots: string): boolean => [...slots].every(isFilled)
