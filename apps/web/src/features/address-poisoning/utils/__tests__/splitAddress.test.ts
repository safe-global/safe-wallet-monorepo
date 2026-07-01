import { splitAddress } from '../splitAddress'

describe('splitAddress', () => {
  it('splits a full address into 0x+4 front, middle, last-4 back', () => {
    const addr = '0xa1b2ffffffffffffffffffffffffffffffff5678'
    expect(splitAddress(addr)).toEqual({
      front: '0xa1b2',
      middle: 'ffffffffffffffffffffffffffffffff',
      back: '5678',
    })
  })

  it('is case-preserving (does not lowercase)', () => {
    const addr = '0xA1B2cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd5678'
    const { front } = splitAddress(addr)
    expect(front).toBe('0xA1B2')
  })

  it('reassembles to the original address', () => {
    const addr = '0x1234000000000000000000000000000000005678'
    const { front, middle, back } = splitAddress(addr)
    expect(front + middle + back).toBe(addr)
  })

  it('degrades gracefully for an unexpectedly short string', () => {
    expect(splitAddress('0x1234')).toEqual({ front: '0x1234', middle: '', back: '' })
  })
})
