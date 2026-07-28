import { getBytes } from 'ethers'
import { h1, h2, h3, h4, h5 } from '../hashes'

// Known-answer tests ported verbatim from
// repos/safenet/validator/src/frost/hashes.test.ts — they pin the RFC-9591
// FROST(secp256k1, SHA-256) hash-to-field port against the live protocol values.
describe('frost hashes — RFC-9591 known-answer tests', () => {
  const input = getBytes('0x37e58bc84afff4e1afade4140135583af3d6d3523a435e60cec5dc75ae3d7e8b')

  it('h1 (rho)', () => {
    expect(h1(input)).toBe(65366193696860196695414947064821663180241281339071613554598903411371557073280n)
  })

  it('h2 (chal) — the verification challenge hash', () => {
    expect(h2(input)).toBe(33150593925562805502779376598105657283445871999808781975649610745815960364725n)
  })

  it('h3 (nonce)', () => {
    expect(h3(input)).toBe(57947748375997171466674059397073681554613456900543402678765823935581620592241n)
  })

  it('h4 (msg)', () => {
    expect(h4(input)).toEqual(getBytes('0x9b0cbeb8a7132d10a14f2b80fcce19e73b96ce7ce30e8c33615aab7767804777'))
  })

  it('h5 (com)', () => {
    expect(h5(input)).toEqual(getBytes('0xe7e18b7374674a612aa7fbfba2741c09e9959ccb5b65fd2add9688b9e51d9f25'))
  })
})
