import { faker } from '@faker-js/faker'
import { getAddress } from 'viem'
import { resolveRecipient } from './recipient'

const address = () => getAddress(faker.finance.ethereumAddress())
const noEns = async () => null

describe('resolveRecipient', () => {
  it('checksums a lowercase address', async () => {
    const recipient = address()

    expect(await resolveRecipient(recipient.toLowerCase(), 'sep', noEns)).toBe(recipient)
  })

  it('accepts an address with the prefix of the current chain', async () => {
    const recipient = address()

    expect(await resolveRecipient(`sep:${recipient}`, 'sep', noEns)).toBe(recipient)
  })

  it('rejects an address with the prefix of another chain', async () => {
    expect(await resolveRecipient(`eth:${address()}`, 'sep', noEns)).toBeUndefined()
  })

  it('rejects text that is neither an address nor an ENS name', async () => {
    expect(await resolveRecipient('not an address', 'sep', noEns)).toBeUndefined()
  })

  it('returns the address that an ENS name resolves to', async () => {
    const recipient = address()

    expect(await resolveRecipient('drain.eth', 'sep', async () => recipient.toLowerCase())).toBe(recipient)
  })

  it('rejects an ENS name that does not resolve', async () => {
    expect(await resolveRecipient('nobody.eth', 'sep', noEns)).toBeUndefined()
  })

  it('rejects an ENS name when the lookup fails', async () => {
    const failingLookup = async () => {
      throw new Error('network error')
    }

    expect(await resolveRecipient('drain.eth', 'sep', failingLookup)).toBeUndefined()
  })
})
