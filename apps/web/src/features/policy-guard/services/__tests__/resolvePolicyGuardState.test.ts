import { faker } from '@faker-js/faker'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { resolvePolicyGuardState } from '../resolvePolicyGuardState'

const policyGuardAddress = '0x1Edd8486031b69205C0fD84924DFe171C6c6688E'
const foreign = faker.finance.ethereumAddress()

describe('resolvePolicyGuardState', () => {
  it('none: both slots empty', () => {
    expect(resolvePolicyGuardState({ txGuard: ZERO_ADDRESS, moduleGuard: ZERO_ADDRESS, policyGuardAddress })).toEqual({
      status: 'none',
    })
  })

  it('known: both slots hold our guard', () => {
    expect(
      resolvePolicyGuardState({ txGuard: policyGuardAddress, moduleGuard: policyGuardAddress, policyGuardAddress }),
    ).toEqual({ status: 'known' })
  })

  it('matches the policy guard regardless of casing', () => {
    expect(
      resolvePolicyGuardState({
        txGuard: policyGuardAddress,
        moduleGuard: policyGuardAddress.toLowerCase(),
        policyGuardAddress,
      }),
    ).toEqual({ status: 'known' })
  })

  it.each([
    ['transaction', ZERO_ADDRESS, policyGuardAddress],
    ['module', policyGuardAddress, ZERO_ADDRESS],
  ] as const)('partial: %s slot missing', (missingSlot, txGuard, moduleGuard) => {
    expect(resolvePolicyGuardState({ txGuard, moduleGuard, policyGuardAddress })).toEqual({
      status: 'partial',
      missingSlot,
    })
  })

  it('unknown: foreign tx guard, empty module slot', () => {
    expect(resolvePolicyGuardState({ txGuard: foreign, moduleGuard: ZERO_ADDRESS, policyGuardAddress })).toEqual({
      status: 'unknown',
      foreignGuards: [{ slot: 'transaction', address: foreign }],
    })
  })

  it('unknown: foreign guard in both slots lists both', () => {
    const other = faker.finance.ethereumAddress()
    expect(resolvePolicyGuardState({ txGuard: foreign, moduleGuard: other, policyGuardAddress })).toEqual({
      status: 'unknown',
      foreignGuards: [
        { slot: 'transaction', address: foreign },
        { slot: 'module', address: other },
      ],
    })
  })

  it('ours plus foreign is unknown, not partial', () => {
    expect(resolvePolicyGuardState({ txGuard: policyGuardAddress, moduleGuard: foreign, policyGuardAddress })).toEqual({
      status: 'unknown',
      foreignGuards: [{ slot: 'module', address: foreign }],
    })
  })
})
