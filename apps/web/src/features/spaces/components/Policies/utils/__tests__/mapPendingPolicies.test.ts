import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { mockSpendingLimitDto } from '../../mocks/activePolicies'
import { mockPendingDto, PENDING_MOCK_DELEGATE } from '../../mocks/pendingPolicies'
import { MOCK_ADDRESSES, MOCK_TOKENS } from '../../mocks/policies'
import type { PolicyTokenInfo } from '../../types'
import { mapActivePolicies, type ResolveTokenInfo } from '../mapActivePolicies'
import { mapPendingPolicies } from '../mapPendingPolicies'

const ETH: PolicyTokenInfo = { address: ZERO_ADDRESS, symbol: 'ETH', decimals: 18, logoUri: null }

const resolveKnownTokens: ResolveTokenInfo = (_chainId, address) => {
  if (sameAddress(address, ZERO_ADDRESS)) return ETH
  if (sameAddress(address, MOCK_TOKENS.usdc.address)) return MOCK_TOKENS.usdc
  return undefined
}

const activeRows = () => mapActivePolicies([mockSpendingLimitDto()], resolveKnownTokens)

const withChanges = (changes: ReturnType<typeof mockPendingDto>['data']['changes']) =>
  mockPendingDto({ data: { ...mockPendingDto().data, changes } })

describe('mapPendingPolicies', () => {
  it('should, when a queued tx adds a delegate with an allowance, render a pending creation', () => {
    const [row] = mapPendingPolicies([mockPendingDto()], [], resolveKnownTokens)

    expect(row).toMatchObject({
      status: 'pending',
      type: 'spending-limit',
      operation: 'create',
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
      nonce: 2,
    })
    expect(row.data.spenders).toEqual([
      {
        spender: PENDING_MOCK_DELEGATE,
        allowances: [
          {
            token: ETH,
            amount: '100000000000000000',
            spent: '0',
            remaining: '100000000000000000',
            resetPeriodMinutes: 0,
            resetsAtMinute: null,
          },
        ],
      },
    ])
  })

  it('should key each row on the transaction and module, not the Safe', () => {
    const rows = mapPendingPolicies(
      [mockPendingDto(), mockPendingDto({ safeTxHash: '0xother', nonce: 3 })],
      activeRows(),
      resolveKnownTokens,
    )

    expect(rows.map((row) => row.id)).toEqual([
      `pending:1:0xc11256ba0538b5f2fad7fc351385b5e87fd926712956de138a5edcfb99eaeead:0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134`,
      `pending:1:0xother:0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134`,
    ])
  })

  it('should, when an existing allowance is changed, render an edit that keeps what was spent', () => {
    const active = activeRows()
    const [row] = mapPendingPolicies(
      [
        withChanges([
          {
            kind: 'set-allowance',
            operation: 'update',
            delegate: MOCK_ADDRESSES.alice.toLowerCase(),
            token: MOCK_TOKENS.usdc.address.toLowerCase(),
            amount: '2000000000',
            resetPeriodMinutes: 43_200,
          },
        ]),
      ],
      active,
      resolveKnownTokens,
    )

    expect(row.operation).toBe('update')
    expect(row.data.spenders[0].allowances[0]).toMatchObject({
      amount: '2000000000',
      spent: '1000000000',
      remaining: '1000000000',
      resetsAtMinute: 29_846_880,
    })
  })

  it('should match the active policy on the enforcing module', () => {
    const active = activeRows()
    const dto = withChanges([
      { kind: 'reset-allowance', operation: 'update', delegate: MOCK_ADDRESSES.alice, token: MOCK_TOKENS.usdc.address },
    ])
    const [row] = mapPendingPolicies(
      [{ ...dto, data: { ...dto.data, module: '0x0000000000000000000000000000000000000001' } }],
      active,
      resolveKnownTokens,
    )

    expect(row.data.spenders[0].allowances).toHaveLength(1)
  })

  it('should, when an allowance is deleted, render a removal of the active allowance', () => {
    const active = activeRows()
    const [row] = mapPendingPolicies(
      [
        withChanges([
          {
            kind: 'delete-allowance',
            operation: 'remove',
            delegate: MOCK_ADDRESSES.alice,
            token: MOCK_TOKENS.usdc.address,
          },
        ]),
      ],
      active,
      resolveKnownTokens,
    )

    expect(row.operation).toBe('remove')
    expect(row.data.spenders[0].allowances[0].amount).toBe('1500000000')
  })

  it('should, when a delegate is removed, list its active allowances as the ones going away', () => {
    const [row] = mapPendingPolicies(
      [
        withChanges([
          { kind: 'remove-delegate', operation: 'remove', delegate: MOCK_ADDRESSES.alice, removeAllowances: true },
        ]),
      ],
      activeRows(),
      resolveKnownTokens,
    )

    expect(row.operation).toBe('remove')
    expect(row.data.spenders[0].allowances).toHaveLength(1)
  })

  it('should, when an allowance is reset, show it with nothing spent', () => {
    const [row] = mapPendingPolicies(
      [
        withChanges([
          {
            kind: 'reset-allowance',
            operation: 'update',
            delegate: MOCK_ADDRESSES.alice,
            token: MOCK_TOKENS.usdc.address,
          },
        ]),
      ],
      activeRows(),
      resolveKnownTokens,
    )

    expect(row.operation).toBe('update')
    expect(row.data.spenders[0].allowances[0]).toMatchObject({ spent: '0', remaining: '1500000000' })
  })

  it('should, when a token is unknown, fall back to base units and a short address', () => {
    const unknown = '0x1111111111111111111111111111111111111111'
    const [row] = mapPendingPolicies(
      [
        withChanges([
          {
            kind: 'set-allowance',
            operation: 'update',
            delegate: PENDING_MOCK_DELEGATE,
            token: unknown,
            amount: '5',
            resetPeriodMinutes: 60,
          },
        ]),
      ],
      [],
      resolveKnownTokens,
    )

    expect(row.data.spenders[0].allowances[0].token).toMatchObject({ address: unknown, decimals: 0 })
  })

  it('should, when a queued tx carries no changes, render no row', () => {
    expect(mapPendingPolicies([withChanges([])], [], resolveKnownTokens)).toEqual([])
  })
})
