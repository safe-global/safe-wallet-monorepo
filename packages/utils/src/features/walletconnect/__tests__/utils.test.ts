import { chainIdToHex } from '../utils'

describe('chainIdToHex', () => {
  it('converts numeric chain ids to hex', () => {
    expect(chainIdToHex('1')).toBe('0x1')
    expect(chainIdToHex('137')).toBe('0x89')
    expect(chainIdToHex(11155111)).toBe('0xaa36a7')
  })
})
