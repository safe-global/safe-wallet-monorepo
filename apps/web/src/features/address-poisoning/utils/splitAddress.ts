export type AddressParts = {
  /** `0x` + the first 4 hex chars — the part a poisoning attacker matches. */
  front: string
  /** Everything between front and back — the part that actually differs. */
  middle: string
  /** The last 4 hex chars — the other part an attacker matches. */
  back: string
}

const FRONT_LEN = 6 // "0x" + 4 hex
const BACK_LEN = 4

/**
 * Split an address into the visually-matched ends (`front`, `back`) and the
 * `middle` that a poisoning look-alike actually changes. Used for the locked
 * front/back of the middle-only re-entry field and the character diff.
 * Concatenating the three parts always returns the original string.
 */
export const splitAddress = (address: string): AddressParts => {
  const front = address.slice(0, FRONT_LEN)
  if (address.length < FRONT_LEN + BACK_LEN) {
    return { front, middle: address.slice(FRONT_LEN), back: '' }
  }
  return {
    front,
    middle: address.slice(FRONT_LEN, -BACK_LEN),
    back: address.slice(-BACK_LEN),
  }
}
