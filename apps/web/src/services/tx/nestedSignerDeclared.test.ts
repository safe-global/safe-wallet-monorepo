import { faker } from '@faker-js/faker'
import { declaredAttributionBuilder } from '@/tests/builders/declaredAttribution'
import { getChildDeclared, withChildDeclared } from './nestedSignerDeclared'

const randomHash = () => faker.string.hexadecimal({ length: 64, casing: 'lower' })

describe('withChildDeclared', () => {
  it('exposes the attribution only while send runs', async () => {
    const hash = randomHash()
    const declared = declaredAttributionBuilder().build()

    const seen = await withChildDeclared(hash, declared, async () => getChildDeclared(hash))

    expect(seen).toEqual(declared)
    expect(getChildDeclared(hash)).toBeUndefined()
  })

  it('removes the attribution and rethrows when send rejects', async () => {
    const hash = randomHash()
    const error = new Error('rejected')

    await expect(
      withChildDeclared(hash, declaredAttributionBuilder().build(), () => Promise.reject(error)),
    ).rejects.toBe(error)
    expect(getChildDeclared(hash)).toBeUndefined()
  })

  it('looks up the hash case-insensitively', async () => {
    const hash = randomHash()
    const declared = declaredAttributionBuilder().build()

    const seen = await withChildDeclared(hash.toUpperCase().replace('0X', '0x'), declared, async () =>
      getChildDeclared(hash),
    )

    expect(seen).toEqual(declared)
  })

  it('keeps concurrent hashes apart', async () => {
    const [hashA, hashB] = [randomHash(), randomHash()]
    const [declaredA, declaredB] = [declaredAttributionBuilder().build(), declaredAttributionBuilder().build()]

    const [seenA, seenB] = await Promise.all([
      withChildDeclared(hashA, declaredA, async () => getChildDeclared(hashA)),
      withChildDeclared(hashB, declaredB, async () => getChildDeclared(hashB)),
    ])

    expect(seenA).toEqual(declaredA)
    expect(seenB).toEqual(declaredB)
  })

  it("does not remove an overlapping call's attribution for the same hash", async () => {
    const hash = randomHash()
    const first = declaredAttributionBuilder().build()
    const second = declaredAttributionBuilder().build()
    let releaseSecond: () => void = () => {}
    const secondBlocked = new Promise<void>((resolve) => (releaseSecond = resolve))

    await withChildDeclared(hash, first, async () => {
      void withChildDeclared(hash, second, () => secondBlocked)
    })

    expect(getChildDeclared(hash)).toEqual(second)
    releaseSecond()
  })

  it('stores nothing without an attribution', async () => {
    const hash = randomHash()

    const seen = await withChildDeclared(hash, undefined, async () => getChildDeclared(hash))

    expect(seen).toBeUndefined()
  })
})
