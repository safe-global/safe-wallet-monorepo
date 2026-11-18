import { faker } from '@faker-js/faker'
import { multisigConfirmationBuilder } from '@/tests/builders/transactionDetails'
import { fakerChecksummedAddress } from '@/tests/test-utils'
import { getSignersHeader, sortSigners } from './utils'

const addressInfo = () => ({ value: fakerChecksummedAddress(), name: faker.person.firstName() })

describe('getSignersHeader', () => {
  it('counts the remaining signatures and the signers who can still give them', () => {
    expect(getSignersHeader(2, 3, 3)).toBe('2 of 3 signed · 1 more from 3 signers')
  })

  it('uses the singular for a single remaining signer', () => {
    expect(getSignersHeader(1, 2, 1)).toBe('1 of 2 signed · 1 more from 1 signer')
  })

  it('says the threshold is met once enough signatures are in', () => {
    expect(getSignersHeader(3, 3, 2)).toBe('3 of 3 signed · threshold met')
    expect(getSignersHeader(4, 3)).toBe('4 of 3 signed · threshold met')
  })

  it('falls back to the missing count when the unsigned signers are unknown', () => {
    expect(getSignersHeader(0, 2)).toBe('0 of 2 signed · 2 more needed')
  })
})

describe('sortSigners', () => {
  it('lists signed owners first and keeps owner order within each group', () => {
    const [a, b, c, d] = [addressInfo(), addressInfo(), addressInfo(), addressInfo()]
    const confirmations = [d, b].map((signer) => multisigConfirmationBuilder().with({ signer }).build())

    expect(sortSigners([a, b, c, d], confirmations)).toEqual([
      { ...b, signed: true },
      { ...d, signed: true },
      { ...a, signed: false },
      { ...c, signed: false },
    ])
  })

  it('matches confirmations regardless of address case', () => {
    const owner = addressInfo()
    const confirmation = multisigConfirmationBuilder()
      .with({ signer: { value: owner.value.toLowerCase() } })
      .build()

    expect(sortSigners([owner], [confirmation])).toEqual([{ ...owner, signed: true }])
  })
})
