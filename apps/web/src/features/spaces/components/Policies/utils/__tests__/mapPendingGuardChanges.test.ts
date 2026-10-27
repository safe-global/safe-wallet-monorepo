import { MOCK_SAFES } from '../../mocks/policies'
import {
  MOCK_POLICY_GUARD,
  mockAllowlistConfiguration,
  mockDelayedGuardDto,
  mockImmediateGuardDto,
  mockPendingDto,
  mockPendingTransactionDto,
} from '../../mocks/pendingPolicies'
import { getNextGuardBoundary, mapPendingGuardChanges } from '../mapPendingGuardChanges'

const MULTISEND_POLICY = '0xF933Ec646F9cd6Dd27Ae2f808D133D3f5847210c'
const ADD_OWNER_SELECTOR = '0x0d582f13'

describe('mapPendingGuardChanges', () => {
  it('maps a delayed change to a pending row carrying its setup', () => {
    const dto = mockDelayedGuardDto({ transaction: mockPendingTransactionDto({ confirmations: 2 }) })

    const [row] = mapPendingGuardChanges([dto])

    expect(row).toEqual({
      id: `guard-change:${dto.safe.chainId}:${dto.safe.address}:${MOCK_POLICY_GUARD}:${dto.root}`,
      type: 'policy-change',
      status: 'pending',
      safe: dto.safe,
      enforcement: { via: 'guard', guardAddress: MOCK_POLICY_GUARD },
      enabled: false,
      setup: {
        flow: 'delayed',
        status: 'pending-application',
        guard: MOCK_POLICY_GUARD,
        root: dto.root,
        configurations: dto.configurations,
        readyAt: dto.readyAt,
        expiresAt: dto.expiresAt,
        transaction: {
          safeTxHash: dto.transaction?.safeTxHash,
          nonce: 7,
          confirmationsSubmitted: 2,
          confirmationsRequired: 2,
          proposedAt: 1_790_342_985,
        },
      },
      progress: expect.objectContaining({ steps: expect.any(Array) }),
      data: { policyType: 'allowlist', ruleCount: 1 },
    })
  })

  it('maps an immediate change to a one-transaction setup', () => {
    const [row] = mapPendingGuardChanges([mockImmediateGuardDto()])

    expect(row.setup).toEqual({
      flow: 'immediate',
      guard: MOCK_POLICY_GUARD,
      transaction: expect.objectContaining({ confirmationsSubmitted: 1, confirmationsRequired: 2 }),
    })
  })

  it('leaves spending limits to their own mapper', () => {
    expect(mapPendingGuardChanges([{ ...mockPendingDto(), kind: 'queued-transaction' }])).toEqual([])
  })

  it('lists a change CGW has no configurations for without a policy type', () => {
    const [row] = mapPendingGuardChanges([mockDelayedGuardDto({ configurations: null })])

    expect(row.data).toEqual({ policyType: undefined, ruleCount: null })
  })

  it.each([
    [
      'a multisend',
      [mockAllowlistConfiguration({ selector: '0x8d80ff0a', operation: 1, policy: MULTISEND_POLICY })],
      'multisend',
    ],
    [
      'a Safe management',
      [mockAllowlistConfiguration({ target: MOCK_SAFES.grants.address, selector: ADD_OWNER_SELECTOR })],
      'safe-management',
    ],
    [
      'a native recipient removal',
      [
        mockAllowlistConfiguration({
          target: '0x91033E6fE839AEbBfEB7900cf802218DdB579859',
          selector: '0x00000000',
          policy: '0x0000000000000000000000000000000000000000',
        }),
      ],
      'allowlist',
    ],
  ])('recognises %s change', (_, configurations, policyType) => {
    const [row] = mapPendingGuardChanges([mockDelayedGuardDto({ configurations })])

    expect(row.data.policyType).toBe(policyType)
  })

  it('leaves a change mixing policies, or setting the fallback, without a policy type', () => {
    const mixed = [
      mockAllowlistConfiguration(),
      mockAllowlistConfiguration({ target: MOCK_SAFES.grants.address, selector: ADD_OWNER_SELECTOR }),
    ]
    const fallback = [
      mockAllowlistConfiguration({
        target: '0x0000000000000000000000000000000000000000',
        selector: '0x00000000',
        policy: '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2',
      }),
    ]

    const rows = mapPendingGuardChanges([
      mockDelayedGuardDto({ configurations: mixed, root: '0x01' }),
      mockDelayedGuardDto({ configurations: fallback, root: '0x02' }),
    ])

    expect(rows.map((row) => row.data.policyType)).toEqual([undefined, undefined])
  })

  it('names a first setup by its policy, not the default fallback it adds', () => {
    const defaultFallback = [0, 1].map((operation) =>
      mockAllowlistConfiguration({
        target: '0x0000000000000000000000000000000000000000',
        selector: '0x00000000',
        operation: operation as 0 | 1,
        policy: '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2',
      }),
    )
    const multisend = mockAllowlistConfiguration({ selector: '0x8d80ff0a', operation: 1, policy: MULTISEND_POLICY })

    const [row] = mapPendingGuardChanges([mockImmediateGuardDto({ configurations: [multisend, ...defaultFallback] })])

    expect(row.data.policyType).toBe('multisend')
  })

  it('names a first allowlist setup by the allowlist, not the batch bindings it adds', () => {
    const batchBindings = [
      '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
      '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
    ].map((target) =>
      mockAllowlistConfiguration({ target, selector: '0x8d80ff0a', operation: 1, policy: MULTISEND_POLICY }),
    )

    const [row] = mapPendingGuardChanges([
      mockImmediateGuardDto({ configurations: [mockAllowlistConfiguration(), ...batchBindings] }),
    ])

    expect(row.data.policyType).toBe('allowlist')
  })

  it('keys a draft apart from the same root requested on a guard', () => {
    const rows = mapPendingGuardChanges([mockDelayedGuardDto(), mockDelayedGuardDto({ status: 'draft', guard: null })])

    expect(new Set(rows.map((row) => row.id)).size).toBe(2)
  })

  it('lists a transaction configuring the same guard twice once', () => {
    expect(mapPendingGuardChanges([mockImmediateGuardDto(), mockImmediateGuardDto()])).toHaveLength(1)
  })
})

describe('getNextGuardBoundary', () => {
  it('returns the earliest future delay end or window close', () => {
    const dtos = [
      mockDelayedGuardDto({ readyAt: 100, expiresAt: 500 }),
      mockDelayedGuardDto({ readyAt: 300, expiresAt: 400 }),
      mockImmediateGuardDto(),
    ]

    expect(getNextGuardBoundary(dtos, 200)).toBe(300)
  })

  it('returns nothing once every boundary has passed', () => {
    expect(getNextGuardBoundary([mockDelayedGuardDto({ readyAt: 100, expiresAt: 150 })], 200)).toBeUndefined()
  })
})
