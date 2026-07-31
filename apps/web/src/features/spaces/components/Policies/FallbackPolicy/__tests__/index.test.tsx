import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { Interface } from 'ethers'
import * as spaces from '@/features/spaces'
import * as availableHook from '../../hooks/useAvailablePolicies'
import * as activeHook from '../../hooks/useActivePolicies'
import * as guardHook from '../../hooks/usePolicyGuard'
import * as storeRequestHook from '../../hooks/useStorePolicyRequest'
import * as useChainsHook from '@/hooks/useChains'
import { TxModalContext } from '@/components/tx-flow'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { fallbackPolicyBuilder, tokenWithdrawPolicyBuilder } from '@/tests/builders/policies'
import { accessId, NO_SELECTOR, OPERATION_CALL } from '../../shared/accessSelector'
import { CONFIGURE_IMMEDIATELY_ABI } from '../../shared/guardTx'
import { savePolicyRequestApi } from '../../policyRequestStore'
import FallbackPolicyFlow from '../index'

const SAFE = { chainId: '1', address: '0x1111111111111111111111111111111111111111', name: 'Ops Safe' }
const GUARD = '0x2222222222222222222222222222222222222222'
const ALLOW = '0x3333333333333333333333333333333333333333'
const DENY = '0x5555555555555555555555555555555555555555'
const NATIVE = '0x6666666666666666666666666666666666666666'
const RECIPIENT = '0x4444444444444444444444444444444444444444'

const guardEnforcement = (policyContract: string) => ({
  via: 'guard' as const,
  guards: { transactionGuard: { policyContract, safePolicyGuard: GUARD } },
})

const mockAll = (guardOverrides = {}) => {
  jest.spyOn(spaces, 'useSpaceSafes').mockReturnValue({
    allSafes: [SAFE],
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: jest.fn(),
  } as never)

  jest.spyOn(availableHook, 'useAvailablePolicies').mockReturnValue({
    policies: [
      fallbackPolicyBuilder()
        .with({ type: PolicyType.Allow, enforcement: guardEnforcement(ALLOW) })
        .build(),
      fallbackPolicyBuilder()
        .with({ type: PolicyType.Deny, enforcement: guardEnforcement(DENY) })
        .build(),
      fallbackPolicyBuilder()
        .with({ type: PolicyType.NativeTransfer, enforcement: guardEnforcement(NATIVE) })
        .build(),
    ],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })

  jest.spyOn(activeHook, 'useActivePolicies').mockReturnValue({
    policies: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })

  const storePolicyRequest = jest.fn().mockResolvedValue({ ok: true })
  jest.spyOn(storeRequestHook, 'useStorePolicyRequest').mockReturnValue(storePolicyRequest)

  jest.spyOn(guardHook, 'usePolicyGuard').mockReturnValue({
    currentGuard: undefined,
    isSet: false,
    isUnknownGuard: false,
    isLoading: false,
    ...guardOverrides,
  })

  jest.spyOn(useChainsHook, 'default').mockReturnValue({
    configs: [{ chainId: SAFE.chainId, shortName: 'eth' }],
  } as never)

  return { storePolicyRequest }
}

const renderFlow = (fallbackType: string, setTxFlow = jest.fn()) => {
  const replace = jest.fn(() => Promise.resolve(true))
  render(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <FallbackPolicyFlow />
    </TxModalContext.Provider>,
    {
      routerProps: {
        replace,
        query: { fallbackType, policySafe: `${SAFE.chainId}:${SAFE.address}`.toLowerCase(), spaceId: 'space-1' },
      },
    },
  )
  return { setTxFlow, replace }
}

describe('FallbackPolicyFlow', () => {
  afterEach(() => {
    for (const request of savePolicyRequestApi.get(SAFE.chainId, SAFE.address)) {
      savePolicyRequestApi.remove(SAFE.chainId, SAFE.address, request.id)
    }
    window.localStorage.clear()
    jest.restoreAllMocks()
  })

  // Nothing to configure: straight to Review with the effect spelled out.
  it('goes straight to Review for Allow and installs the catch-all policy', async () => {
    mockAll()
    const { setTxFlow } = renderFlow(PolicyType.Allow)

    expect(screen.getByText(/Any call this Safe makes that no other policy covers will be permitted/)).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: /review/i }))
    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

    const txs = setTxFlow.mock.calls[0][0].props.txs
    const [configurations] = new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData(
      'configureImmediately',
      txs[1].data,
    )
    expect(configurations[0].policy.toLowerCase()).toBe(ALLOW.toLowerCase())
    expect(configurations[0].selector).toBe(NO_SELECTOR)
    expect(configurations[0].data).toBe('0x')
  })

  describe('Deny', () => {
    it('spells out that the guard cannot be removed afterwards', () => {
      mockAll()
      renderFlow(PolicyType.Deny)

      expect(screen.getByText(/blocks every transaction no other policy covers/i)).toBeVisible()
      expect(screen.getByText(/Removing the guard is blocked too/i)).toBeVisible()
    })

    it('requires an explicit acknowledgement before it can be signed', async () => {
      mockAll()
      const { setTxFlow } = renderFlow(PolicyType.Deny)

      expect(screen.getByRole('button', { name: /review/i })).toBeDisabled()

      fireEvent.click(screen.getByLabelText('Confirm deny by default'))
      expect(screen.getByRole('button', { name: /review/i })).toBeEnabled()

      fireEvent.click(screen.getByRole('button', { name: /review/i }))
      await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

      const [configurations] = new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData(
        'configureImmediately',
        setTxFlow.mock.calls[0][0].props.txs[1].data,
      )
      expect(configurations[0].policy.toLowerCase()).toBe(DENY.toLowerCase())
    })
  })

  describe('Native transfers', () => {
    it('offers an optional recipient scope', async () => {
      mockAll()
      const { setTxFlow } = renderFlow(PolicyType.NativeTransfer)

      // The scope step exists only for this type.
      fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: RECIPIENT } })
      fireEvent.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByText(/Value transfers to 0x4444...4444/)).toBeVisible()

      fireEvent.click(screen.getByRole('button', { name: /review/i }))
      await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

      const [configurations] = new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData(
        'configureImmediately',
        setTxFlow.mock.calls[0][0].props.txs[1].data,
      )
      expect(configurations[0].target.toLowerCase()).toBe(RECIPIENT.toLowerCase())
    })

    it('covers every value transfer when no recipient is given', () => {
      mockAll()
      renderFlow(PolicyType.NativeTransfer)

      fireEvent.click(screen.getByRole('button', { name: /continue/i }))
      expect(screen.getByText('Any uncovered call')).toBeVisible()
    })

    it('rejects a malformed recipient', () => {
      mockAll()
      renderFlow(PolicyType.NativeTransfer)

      fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: '0xnope' } })
      expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    })
  })

  // Only one fallback applies at a time, so installing one replaces the current one.
  it('warns that the policy already in the fallback slot will be replaced', () => {
    mockAll()
    jest.spyOn(activeHook, 'useActivePolicies').mockReturnValue({
      policies: [
        tokenWithdrawPolicyBuilder()
          .with({
            id: accessId({
              target: '0x0000000000000000000000000000000000000000',
              selector: NO_SELECTOR,
              operation: OPERATION_CALL,
            }),
          })
          .build(),
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })
    renderFlow(PolicyType.Allow)

    expect(screen.getByText(/replaces a policy already active/i)).toBeVisible()
  })

  it('stores the configurations before proposing when the guard is already live', async () => {
    const { storePolicyRequest } = mockAll({ currentGuard: GUARD, isSet: true })
    const { setTxFlow } = renderFlow(PolicyType.Allow)

    fireEvent.click(screen.getByRole('button', { name: /review/i }))
    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

    expect(storePolicyRequest).toHaveBeenCalledTimes(1)
    expect(storePolicyRequest.mock.invocationCallOrder[0]).toBeLessThan(setTxFlow.mock.invocationCallOrder[0])

    setTxFlow.mock.calls[0][0].props.onSubmit({ txId: '0xtx' })
    const [snapshot] = savePolicyRequestApi.get(SAFE.chainId, SAFE.address)
    expect(snapshot.type).toBe(PolicyType.Allow)
  })

  it('falls back to Allow when the query names no known type', () => {
    mockAll()
    renderFlow('NotAPolicy')

    expect(screen.getByText(/will be permitted/)).toBeVisible()
  })
})
