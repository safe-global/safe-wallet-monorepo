import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { AbiCoder, Interface } from 'ethers'
import * as spaces from '@/features/spaces'
import * as availableHook from '../../hooks/useAvailablePolicies'
import * as activeHook from '../../hooks/useActivePolicies'
import * as guardHook from '../../hooks/usePolicyGuard'
import * as storeRequestHook from '../../hooks/useStorePolicyRequest'
import * as useChainsHook from '@/hooks/useChains'
import { TxModalContext } from '@/components/tx-flow'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { availablePolicyBuilder, tokenWithdrawPolicyBuilder } from '@/tests/builders/policies'
import { accessId } from '../../shared/accessSelector'
import { savePolicyRequestApi } from '../../policyRequestStore'
import { CONFIGURE_IMMEDIATELY_ABI, REQUEST_CONFIGURATION_ABI } from '../../shared/guardTx'
import CosignerPolicyFlow from '../index'

const SAFE = { chainId: '1', address: '0x1111111111111111111111111111111111111111', name: 'Ops Safe' }
const TARGET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const TRANSFER = '0xa9059cbb'
const GUARD = '0x2222222222222222222222222222222222222222'
const POLICY = '0x3333333333333333333333333333333333333333'
const COSIGNER = '0x4444444444444444444444444444444444444444'

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
      availablePolicyBuilder()
        .with({
          type: PolicyType.Cosigner,
          enforcement: {
            via: 'guard',
            guards: { transactionGuard: { policyContract: POLICY, safePolicyGuard: GUARD } },
          },
        })
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

const renderFlow = (setTxFlow = jest.fn(), query: Record<string, string> = {}) => {
  const replace = jest.fn(() => Promise.resolve(true))
  render(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <CosignerPolicyFlow />
    </TxModalContext.Provider>,
    { routerProps: { replace, query } },
  )
  return { setTxFlow, replace }
}

/** safe → access → cosigner → review */
const advanceToReview = async (cosigner = COSIGNER, selector = TRANSFER) => {
  fireEvent.click(screen.getByText('Ops Safe'))
  fireEvent.click(screen.getByRole('button', { name: /continue/i })) // -> access
  fireEvent.change(await screen.findByLabelText('Target address'), { target: { value: TARGET } })
  if (selector) fireEvent.change(screen.getByLabelText('Function selector'), { target: { value: selector } })
  fireEvent.click(screen.getByRole('button', { name: /continue/i })) // -> cosigner
  fireEvent.change(screen.getByLabelText('Cosigner address'), { target: { value: cosigner } })
  fireEvent.click(screen.getByRole('button', { name: /continue/i })) // -> review
}

describe('CosignerPolicyFlow', () => {
  afterEach(() => {
    for (const request of savePolicyRequestApi.get(SAFE.chainId, SAFE.address)) {
      savePolicyRequestApi.remove(SAFE.chainId, SAFE.address, request.id)
    }
    window.localStorage.clear()
    jest.restoreAllMocks()
  })

  it('walks safe → access → cosigner → review and hands a batch to the tx-flow', async () => {
    mockAll()
    const { setTxFlow } = renderFlow()
    await advanceToReview()

    fireEvent.click(screen.getByRole('button', { name: /review/i }))
    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

    const txs = setTxFlow.mock.calls[0][0].props.txs
    expect(txs).toHaveLength(2)

    // The guard call carries the cosigner as a bare address, per CoSignerPolicy.configure.
    const [configurations] = new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData(
      'configureImmediately',
      txs[1].data,
    )
    const [decoded] = AbiCoder.defaultAbiCoder().decode(['address'], configurations[0].data)
    expect(decoded.toLowerCase()).toBe(COSIGNER.toLowerCase())
  })

  it('blocks Continue until the access is valid', async () => {
    mockAll()
    renderFlow()

    fireEvent.click(screen.getByText('Ops Safe'))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // No target yet.
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()

    fireEvent.change(await screen.findByLabelText('Target address'), { target: { value: TARGET } })
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()

    // A malformed selector blocks it again; an empty one is valid (value transfers).
    fireEvent.change(screen.getByLabelText('Function selector'), { target: { value: '0xabc' } })
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Function selector'), { target: { value: '' } })
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  })

  it('blocks Continue until a valid cosigner is entered', async () => {
    mockAll()
    renderFlow()

    fireEvent.click(screen.getByText('Ops Safe'))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(await screen.findByLabelText('Target address'), { target: { value: TARGET } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Cosigner address'), { target: { value: '0xnot-an-address' } })
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('covers plain value transfers when no selector is given', async () => {
    mockAll()
    const { setTxFlow } = renderFlow()
    await advanceToReview(COSIGNER, '')

    expect(screen.getByText(/value transfer \(no selector\)/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /review/i }))
    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

    const [configurations] = new Interface(CONFIGURE_IMMEDIATELY_ABI).decodeFunctionData(
      'configureImmediately',
      setTxFlow.mock.calls[0][0].props.txs[1].data,
    )
    expect(configurations[0].selector).toBe('0x00000000')
  })

  // The guard keeps one policy per access, so an occupied access is replaced silently.
  it('warns that an active policy on the same access will be replaced', async () => {
    mockAll()
    jest.spyOn(activeHook, 'useActivePolicies').mockReturnValue({
      policies: [
        tokenWithdrawPolicyBuilder()
          .with({ id: accessId({ target: TARGET, selector: TRANSFER, operation: 0 }) })
          .build(),
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })
    renderFlow()
    await advanceToReview()

    expect(screen.getByText(/replaces a policy already active/i)).toBeInTheDocument()
  })

  it('does not warn when the access is free', async () => {
    mockAll()
    renderFlow()
    await advanceToReview()

    expect(screen.queryByText(/replaces a policy already active/i)).not.toBeInTheDocument()
  })

  // A Safe cosigning its own transactions could never satisfy the check.
  it('rejects the Safe itself as the cosigner', async () => {
    mockAll()
    renderFlow()

    fireEvent.click(screen.getByText('Ops Safe'))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(await screen.findByLabelText('Target address'), { target: { value: TARGET } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(screen.getByLabelText('Cosigner address'), { target: { value: SAFE.address } })

    expect(screen.getByText(/can't cosign its own transactions/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  // The guard reads the cosigner's signature off the tail of the `signatures` bytes, so the
  // user has to know a signature will be needed at execution before they sign this.
  it('warns that a cosigner signature will be required at execution', async () => {
    mockAll()
    renderFlow()
    await advanceToReview()

    expect(screen.getByText(/signature will be required at execution/i)).toBeInTheDocument()
  })

  it('stores the configurations before proposing, and snapshots the request', async () => {
    // Guard already installed → the delayed request path.
    const { storePolicyRequest } = mockAll({ currentGuard: GUARD, isSet: true })
    const { setTxFlow } = renderFlow()
    await advanceToReview()

    fireEvent.click(screen.getByRole('button', { name: /review/i }))
    await waitFor(() => expect(setTxFlow).toHaveBeenCalled())

    expect(storePolicyRequest).toHaveBeenCalledTimes(1)
    const stored = storePolicyRequest.mock.calls[0][0]
    const [root] = new Interface(REQUEST_CONFIGURATION_ABI).decodeFunctionData(
      'requestConfiguration',
      setTxFlow.mock.calls[0][0].props.txs[0].data,
    )
    expect(root).toBe(stored.root)
    expect(storePolicyRequest.mock.invocationCallOrder[0]).toBeLessThan(setTxFlow.mock.invocationCallOrder[0])

    // A cosigner change has no allowlist, so the snapshot carries only the configurations.
    setTxFlow.mock.calls[0][0].props.onSubmit({ txId: '0xtx' })
    const [snapshot] = savePolicyRequestApi.get(SAFE.chainId, SAFE.address)
    expect(snapshot.type).toBe(PolicyType.Cosigner)
    expect(snapshot.data).toBeUndefined()
    expect(snapshot.configurations).toHaveLength(1)
  })

  it('skips the Safe step when the policies page already chose one', async () => {
    mockAll()
    renderFlow(jest.fn(), { policySafe: `${SAFE.chainId}:${SAFE.address}`.toLowerCase() })

    // Straight to tokens.
    expect(await screen.findByText('Which calls need a cosigner?')).toBeInTheDocument()
  })
})
