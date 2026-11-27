import { faker } from '@faker-js/faker'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { buildSafeAccountId, groupSafeAccounts } from '../../../SafeAccountSelector/utils'
import {
  isSafeAccountGroup,
  type SafeAccountOption,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import { hasSelectableSafeAccount, markAllowlistIneligibility } from '../safeAccounts'

const SAFE_A = faker.finance.ethereumAddress()
const SAFE_B = faker.finance.ethereumAddress()
const SEPOLIA = '11155111'
const GNOSIS_CHAIN = '100'

const CHAINS = new Map([
  [SEPOLIA, { chainId: SEPOLIA, features: [FEATURES.POLICY_RECIPIENT_ALLOWLIST] }],
  [GNOSIS_CHAIN, { chainId: GNOSIS_CHAIN, features: [FEATURES.POLICY_RECIPIENT_ALLOWLIST] }],
])

const option = (chainId: string, address = SAFE_A, extra: Partial<SafeAccountOption> = {}): SafeAccountOption => ({
  id: buildSafeAccountId(chainId, address),
  chainId,
  address,
  eligibility: 'signer',
  ...extra,
})

const versions = (entries: [SafeAccountOption, string | null][]) =>
  new Map(entries.map(([account, version]) => [account.id, version]))

describe('markAllowlistIneligibility', () => {
  it('leaves a Safe of v1.5.0 or newer on an enabled chain selectable', () => {
    const safe = option(SEPOLIA)

    expect(markAllowlistIneligibility([safe], CHAINS, versions([[safe, '1.5.0']]))).toEqual([safe])
  })

  it('disables a Safe on a chain without a policy guard deployment', () => {
    const safe = option(GNOSIS_CHAIN)

    const [row] = markAllowlistIneligibility([safe], CHAINS, versions([[safe, '1.5.0']]))

    expect(row).toMatchObject({ ineligibleReason: 'no-recipient-allowlists' })
  })

  it('disables a Safe on a chain without the feature flag', () => {
    const safe = option(SEPOLIA)
    const chains = new Map([[SEPOLIA, { chainId: SEPOLIA, features: [] }]])

    const [row] = markAllowlistIneligibility([safe], chains, versions([[safe, '1.5.0']]))

    expect(row).toMatchObject({ ineligibleReason: 'no-recipient-allowlists' })
  })

  it('disables a Safe below v1.5.0', () => {
    const safe = option(SEPOLIA)

    const [row] = markAllowlistIneligibility([safe], CHAINS, versions([[safe, '1.4.1']]))

    expect(row).toMatchObject({ ineligibleReason: 'unsupported-safe-version' })
  })

  it('disables a Safe CGW reports without a version', () => {
    const safe = option(SEPOLIA)

    const [row] = markAllowlistIneligibility([safe], CHAINS, versions([[safe, null]]))

    expect(row).toMatchObject({ ineligibleReason: 'unsupported-safe-version' })
  })

  it('leaves a Safe whose version could not be read selectable', () => {
    const safe = option(SEPOLIA)

    expect(markAllowlistIneligibility([safe], CHAINS, new Map())).toEqual([safe])
  })

  it('keeps a not-activated reason', () => {
    const safe = option(SEPOLIA, SAFE_A, { ineligibleReason: 'not-activated' })

    const [row] = markAllowlistIneligibility([safe], CHAINS, new Map())

    expect(row).toMatchObject({ ineligibleReason: 'not-activated' })
  })

  it('keeps a multichain group together with only its ineligible chains marked', () => {
    const sepolia = option(SEPOLIA)
    const gnosisChain = option(GNOSIS_CHAIN)

    const [group] = markAllowlistIneligibility(
      groupSafeAccounts([sepolia, gnosisChain]),
      CHAINS,
      versions([[sepolia, '1.5.0']]),
    )

    expect(
      isSafeAccountGroup(group) && group.accounts.map(({ chainId, ineligibleReason }) => [chainId, ineligibleReason]),
    ).toEqual([
      [GNOSIS_CHAIN, 'no-recipient-allowlists'],
      [SEPOLIA, undefined],
    ])
  })
})

describe('hasSelectableSafeAccount', () => {
  it('is true with one selectable Safe among disabled ones', () => {
    const entries = [option(SEPOLIA, SAFE_A, { ineligibleReason: 'unsupported-safe-version' }), option(SEPOLIA, SAFE_B)]

    expect(hasSelectableSafeAccount(entries)).toBe(true)
  })

  it('is false when every Safe is disabled', () => {
    const entries = [option(GNOSIS_CHAIN, SAFE_A, { ineligibleReason: 'no-recipient-allowlists' })]

    expect(hasSelectableSafeAccount(entries)).toBe(false)
  })

  it('is false without Safes', () => {
    expect(hasSelectableSafeAccount([])).toBe(false)
  })
})
