import { reconcileDeployedSafes, getDeployedEntries } from '../utils'
import type { SpaceSafeEntry } from '../types'

const scanKey = (address: string, chainId: string) => `${address}:${chainId}`

const SAFE_A = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'
const SAFE_B = '0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb'

const mkMultichain = (address: string, entries: Array<{ chainId: string; isDeployed: boolean }>): SpaceSafeEntry => ({
  address,
  chainId: entries[0]?.chainId ?? '1',
  name: 'Multi',
  isMultichain: true,
  chainEntries: entries,
})

const mkSingle = (address: string, chainId: string, isDeployed = true): SpaceSafeEntry => ({
  address,
  chainId,
  name: 'Single',
  isMultichain: false,
  chainEntries: [{ chainId, isDeployed }],
})

describe('reconcileDeployedSafes', () => {
  it('returns the input unchanged when confirmedDeployedKeys is null (still loading)', () => {
    const safes = [mkMultichain(SAFE_A, [{ chainId: '1', isDeployed: true }])]
    const result = reconcileDeployedSafes(safes, null, scanKey)
    expect(result).toBe(safes)
  })

  it('leaves safes alone when every locally-deployed chain is confirmed by CGW', () => {
    const safes = [
      mkMultichain(SAFE_A, [
        { chainId: '1', isDeployed: true },
        { chainId: '137', isDeployed: true },
      ]),
    ]
    const confirmed = new Set([scanKey(SAFE_A, '1'), scanKey(SAFE_A, '137')])
    const result = reconcileDeployedSafes(safes, confirmed, scanKey)
    // Identity preserved when nothing changes — lets downstream memoisation stay stable.
    expect(result[0]).toBe(safes[0])
  })

  it('flips a ghost-deployed multichain entry to isDeployed=false', () => {
    const safes = [
      mkMultichain(SAFE_A, [
        { chainId: '1', isDeployed: true },
        { chainId: '137', isDeployed: true }, // ghost: not returned by CGW
      ]),
    ]
    const confirmed = new Set([scanKey(SAFE_A, '1')])
    const result = reconcileDeployedSafes(safes, confirmed, scanKey)
    expect(result[0].chainEntries[0]).toEqual({ chainId: '1', isDeployed: true })
    expect(result[0].chainEntries[1]).toEqual({ chainId: '137', isDeployed: false })
  })

  it('leaves already-undeployed chains untouched (no spurious flips)', () => {
    const safes = [
      mkMultichain(SAFE_A, [
        { chainId: '1', isDeployed: true },
        { chainId: '137', isDeployed: false }, // locally known-counterfactual
      ]),
    ]
    const confirmed = new Set([scanKey(SAFE_A, '1')])
    const result = reconcileDeployedSafes(safes, confirmed, scanKey)
    expect(result[0].chainEntries[1]).toEqual({ chainId: '137', isDeployed: false })
  })

  it('handles single-chain safes', () => {
    const safes = [mkSingle(SAFE_B, '10', true)]
    const confirmed = new Set<string>() // response returned data for other safes but not this one
    // Guard note: caller passes null for the "empty response" case, so receiving an empty set
    // here means CGW responded with other safes but not this one — i.e. this Safe is a ghost.
    const result = reconcileDeployedSafes(safes, confirmed, scanKey)
    expect(result[0].chainEntries[0]).toEqual({ chainId: '10', isDeployed: false })
  })
})

describe('getDeployedEntries', () => {
  it('excludes chain entries flagged not-deployed after reconciliation', () => {
    const safes = [
      mkMultichain(SAFE_A, [
        { chainId: '1', isDeployed: true },
        { chainId: '137', isDeployed: false },
      ]),
      mkSingle(SAFE_B, '10', true),
    ]
    const entries = getDeployedEntries(safes)
    expect(entries).toEqual([
      { address: SAFE_A, chainId: '1' },
      { address: SAFE_B, chainId: '10' },
    ])
  })
})
