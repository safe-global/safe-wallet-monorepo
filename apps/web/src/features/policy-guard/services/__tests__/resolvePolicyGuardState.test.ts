import { faker } from '@faker-js/faker'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { resolvePolicyGuardState } from '../resolvePolicyGuardState'

const chainId = '11155111'
const guard180 = '0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f'
const guard600 = '0x46d22E0B3DC367b48bc2d64B789ae154b3177a57'
const foreign = faker.finance.ethereumAddress()

describe('resolvePolicyGuardState', () => {
  it('none: both slots empty', () => {
    expect(resolvePolicyGuardState({ txGuard: ZERO_ADDRESS, moduleGuard: ZERO_ADDRESS, chainId })).toEqual({
      status: 'none',
    })
  })

  it.each([guard180, guard600])('known: both slots hold the policy guard %s', (guard) => {
    expect(resolvePolicyGuardState({ txGuard: guard, moduleGuard: guard, chainId })).toEqual({
      status: 'known',
      guardAddress: guard,
    })
  })

  it('matches the policy guard regardless of casing', () => {
    expect(resolvePolicyGuardState({ txGuard: guard600, moduleGuard: guard600.toLowerCase(), chainId })).toMatchObject({
      status: 'known',
    })
  })

  it.each([
    ['transaction', ZERO_ADDRESS, guard600],
    ['module', guard600, ZERO_ADDRESS],
  ] as const)('partial: %s slot missing, with the installed guard', (missingSlot, txGuard, moduleGuard) => {
    expect(resolvePolicyGuardState({ txGuard, moduleGuard, chainId })).toEqual({
      status: 'partial',
      missingSlot,
      guardAddress: guard600,
    })
  })

  it('unknown: two different policy guards, with the module guard as the foreign one', () => {
    expect(resolvePolicyGuardState({ txGuard: guard600, moduleGuard: guard180, chainId })).toEqual({
      status: 'unknown',
      foreignGuards: [{ slot: 'module', address: guard180 }],
    })
  })

  it('unknown: a policy guard that is not deployed on the chain', () => {
    expect(resolvePolicyGuardState({ txGuard: guard180, moduleGuard: guard180, chainId: '1' })).toEqual({
      status: 'unknown',
      foreignGuards: [
        { slot: 'transaction', address: guard180 },
        { slot: 'module', address: guard180 },
      ],
    })
  })

  it('unknown: foreign tx guard, empty module slot', () => {
    expect(resolvePolicyGuardState({ txGuard: foreign, moduleGuard: ZERO_ADDRESS, chainId })).toEqual({
      status: 'unknown',
      foreignGuards: [{ slot: 'transaction', address: foreign }],
    })
  })

  it('unknown: foreign guard in both slots lists both', () => {
    const other = faker.finance.ethereumAddress()
    expect(resolvePolicyGuardState({ txGuard: foreign, moduleGuard: other, chainId })).toEqual({
      status: 'unknown',
      foreignGuards: [
        { slot: 'transaction', address: foreign },
        { slot: 'module', address: other },
      ],
    })
  })

  it('a policy guard plus a foreign one is unknown, not partial', () => {
    expect(resolvePolicyGuardState({ txGuard: guard180, moduleGuard: foreign, chainId })).toEqual({
      status: 'unknown',
      foreignGuards: [{ slot: 'module', address: foreign }],
    })
  })
})
