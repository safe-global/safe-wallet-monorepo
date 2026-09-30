import { act, renderHook } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import type { OnboardAPI } from '@web3-onboard/core'
import type { JsonRpcProvider, JsonRpcSigner } from 'ethers'
import * as delegatesApi from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { PROPOSER_LABEL_PLACEHOLDER, SMART_CONTRACT_PROPOSER_ERROR } from '@/features/proposers/constants'
import * as proposerUtils from '@/features/proposers/utils/utils'
import * as useChainIdModule from '@/hooks/useChainId'
import * as useSafeAddressModule from '@/hooks/useSafeAddress'
import * as useOnboardModule from '@/hooks/wallets/useOnboard'
import * as useWalletModule from '@/hooks/wallets/useWallet'
import * as web3ReadOnlyModule from '@/hooks/wallets/web3ReadOnly'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import * as sdk from '@/services/tx/tx-sender/sdk'
import { getStoreInstance } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import { useGrantProposer } from '../useGrantProposer'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const CHAIN_ID = '137'
const SAFE = checksumAddress(faker.finance.ethereumAddress())
const PROPOSER = checksumAddress(faker.finance.ethereumAddress())
const signer = {} as JsonRpcSigner
const provider = {} as JsonRpcProvider

type PostV2 = ReturnType<typeof delegatesApi.useDelegatesPostDelegateV2Mutation>

const mutation = () => {
  const trigger = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({}) })
  return { trigger, tuple: [trigger, { isLoading: false, reset: jest.fn() }] as unknown as PostV2 }
}

const wallet = (label: string) => connectedWalletBuilder().with({ label, chainId: CHAIN_ID }).build()

const onboard = {} as OnboardAPI

// Mirrors `assertWalletChain`: the wallet the flow signs with is the one it returns, post-switch.
const connect = (label: string) => {
  const connected = wallet(label)
  jest.spyOn(useWalletModule, 'default').mockReturnValue(connected)
  jest.spyOn(sdk, 'assertWalletChain').mockResolvedValue(connected)
  return connected
}

describe('useGrantProposer', () => {
  let addV1: ReturnType<typeof mutation>
  let addV2: ReturnType<typeof mutation>

  beforeEach(() => {
    localStorage.clear()
    jest.mocked(trackEvent).mockClear()
    addV1 = mutation()
    addV2 = mutation()
    jest.spyOn(delegatesApi, 'useDelegatesPostDelegateV1Mutation').mockReturnValue(addV1.tuple)
    jest.spyOn(delegatesApi, 'useDelegatesPostDelegateV2Mutation').mockReturnValue(addV2.tuple)
    jest.spyOn(useChainIdModule, 'default').mockReturnValue(CHAIN_ID)
    jest.spyOn(useSafeAddressModule, 'default').mockReturnValue(SAFE)
    jest.spyOn(useOnboardModule, 'default').mockReturnValue(onboard)
    connect('MetaMask')
    jest.spyOn(web3ReadOnlyModule, 'useWeb3ReadOnly').mockReturnValue(provider)
    jest.spyOn(sdk, 'getAssertedChainSigner').mockResolvedValue(signer)
    jest.spyOn(proposerUtils, 'addressIsNotSmartContract').mockReturnValue(async () => undefined)
    jest.spyOn(proposerUtils, 'signProposerTypedData').mockResolvedValue('0xtyped')
    jest.spyOn(proposerUtils, 'signProposerData').mockResolvedValue('0xethsign')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const submit = async (values = { proposer: PROPOSER, name: 'Nicole' }) => {
    const rendered = renderHook(() => useGrantProposer())
    let ok = false
    await act(async () => {
      ok = await rendered.result.current.grantProposerRole(values)
    })
    return { ok, result: rendered.result }
  }

  it('signs typed data and posts to the v2 endpoint scoped to the selected Safe', async () => {
    const { ok } = await submit()

    expect(ok).toBe(true)
    expect(proposerUtils.signProposerTypedData).toHaveBeenCalledWith(CHAIN_ID, PROPOSER, signer)
    expect(addV2.trigger).toHaveBeenCalledWith({
      chainId: CHAIN_ID,
      createDelegateDto: {
        delegate: PROPOSER,
        delegator: expect.any(String),
        label: PROPOSER_LABEL_PLACEHOLDER,
        signature: '0xtyped',
        safe: SAFE,
      },
    })
    expect(addV1.trigger).not.toHaveBeenCalled()
    expect(proposerUtils.signProposerData).not.toHaveBeenCalled()
  })

  it('uses the connected wallet as the delegator', async () => {
    const connected = connect('MetaMask')

    await submit()

    expect(addV2.trigger.mock.calls[0][0].createDelegateDto.delegator).toBe(connected.address)
  })

  it('uses eth_sign and the v1 endpoint for Trezor', async () => {
    connect('Trezor')

    const { ok } = await submit()

    expect(ok).toBe(true)
    expect(proposerUtils.signProposerData).toHaveBeenCalledWith(PROPOSER, signer)
    expect(addV1.trigger).toHaveBeenCalledWith({
      chainId: CHAIN_ID,
      createDelegateDto: expect.objectContaining({ signature: '0xethsign', safe: SAFE }),
    })
    expect(addV2.trigger).not.toHaveBeenCalled()
    expect(proposerUtils.signProposerTypedData).not.toHaveBeenCalled()
  })

  it('checks the proposer against the scoped chain and provider before signing', async () => {
    await submit()

    expect(proposerUtils.addressIsNotSmartContract).toHaveBeenCalledWith(
      CHAIN_ID,
      SMART_CONTRACT_PROPOSER_ERROR,
      provider,
    )
  })

  it('stores the sanitised name for the selected chain only and shows the success toast', async () => {
    await submit({ proposer: PROPOSER, name: '  Nicole  ' })

    const state = getStoreInstance().getState()
    expect(state.addressBook[CHAIN_ID]?.[PROPOSER]).toBe('Nicole')
    expect(Object.keys(state.addressBook)).toEqual([CHAIN_ID])
    expect(selectNotifications(state)).toEqual([
      expect.objectContaining({
        variant: 'success',
        groupKey: 'add-proposer-success',
        title: 'Proposer added successfully!',
      }),
    ])
  })

  it('never sends the entered name to the API', async () => {
    await submit({ proposer: PROPOSER, name: 'Nicole' })

    expect(addV2.trigger.mock.calls[0][0].createDelegateDto.label).toBe(PROPOSER_LABEL_PLACEHOLDER)
  })

  it('switches the wallet to the selected Safe chain before signing', async () => {
    await submit()

    expect(sdk.assertWalletChain).toHaveBeenCalledWith(onboard, CHAIN_ID)
    const switchOrder = jest.mocked(sdk.assertWalletChain).mock.invocationCallOrder[0]
    expect(jest.mocked(proposerUtils.signProposerTypedData).mock.invocationCallOrder[0]).toBeGreaterThan(switchOrder)
  })

  it('signs as the wallet returned by the chain switch, not the pre-switch one', async () => {
    const switched = wallet('MetaMask')
    jest.spyOn(sdk, 'assertWalletChain').mockResolvedValue(switched)

    await submit()

    expect(addV2.trigger.mock.calls[0][0].createDelegateDto.delegator).toBe(switched.address)
  })

  it('surfaces a refused chain switch without signing or posting', async () => {
    jest.spyOn(sdk, 'assertWalletChain').mockRejectedValue(new Error('Wallet connected to wrong chain.'))

    const { ok, result } = await submit()

    expect(ok).toBe(false)
    expect(result.current.error?.message).toBe('Wallet connected to wrong chain.')
    expect(proposerUtils.signProposerTypedData).not.toHaveBeenCalled()
    expect(addV2.trigger).not.toHaveBeenCalled()
    expect(getStoreInstance().getState().addressBook[CHAIN_ID]).toBeUndefined()
  })

  it('tracks the submit event once the proposer is added', async () => {
    await submit()

    expect(trackEvent).toHaveBeenCalledWith(SETTINGS_EVENTS.PROPOSERS.SUBMIT_ADD_PROPOSER)
  })

  it('does not track the submit event when the request fails', async () => {
    addV2.trigger.mockReturnValue({ unwrap: () => Promise.reject(new Error('422')) })

    await submit()

    expect(trackEvent).not.toHaveBeenCalledWith(SETTINGS_EVENTS.PROPOSERS.SUBMIT_ADD_PROPOSER)
  })

  it('blocks a smart-contract proposer before asking for a signature', async () => {
    jest.spyOn(proposerUtils, 'addressIsNotSmartContract').mockReturnValue(async () => SMART_CONTRACT_PROPOSER_ERROR)

    const { ok, result } = await submit()

    expect(ok).toBe(false)
    expect(result.current.blockedReason).toBe(SMART_CONTRACT_PROPOSER_ERROR)
    expect(result.current.error).toBeUndefined()
    expect(sdk.getAssertedChainSigner).not.toHaveBeenCalled()
    expect(addV2.trigger).not.toHaveBeenCalled()
  })

  it('surfaces a rejected signature as an error without posting or saving the name', async () => {
    jest.spyOn(proposerUtils, 'signProposerTypedData').mockRejectedValue(new Error('User rejected'))

    const { ok, result } = await submit()

    expect(ok).toBe(false)
    expect(result.current.error?.message).toBe('User rejected')
    expect(addV2.trigger).not.toHaveBeenCalled()
    expect(getStoreInstance().getState().addressBook[CHAIN_ID]).toBeUndefined()
    expect(selectNotifications(getStoreInstance().getState())).toEqual([])
  })

  it('surfaces a failed request as an error without saving the name', async () => {
    addV2.trigger.mockReturnValue({ unwrap: () => Promise.reject(new Error('422')) })

    const { ok, result } = await submit()

    expect(ok).toBe(false)
    expect(result.current.error?.message).toBe('422')
    expect(getStoreInstance().getState().addressBook[CHAIN_ID]).toBeUndefined()
  })

  it('does nothing without a connected wallet', async () => {
    jest.spyOn(useWalletModule, 'default').mockReturnValue(null)

    const { ok } = await submit()

    expect(ok).toBe(false)
    expect(proposerUtils.addressIsNotSmartContract).not.toHaveBeenCalled()
    expect(sdk.getAssertedChainSigner).not.toHaveBeenCalled()
  })

  it('clears the previous error and blocked reason on the next attempt', async () => {
    addV2.trigger.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('422')) })
    const { result } = renderHook(() => useGrantProposer())

    await act(async () => {
      await result.current.grantProposerRole({ proposer: PROPOSER, name: 'Nicole' })
    })
    expect(result.current.error?.message).toBe('422')

    await act(async () => {
      await result.current.grantProposerRole({ proposer: PROPOSER, name: 'Nicole' })
    })
    expect(result.current.error).toBeUndefined()
    expect(result.current.isSubmitting).toBe(false)
  })

  it('clears the error and blocked reason on reset', async () => {
    addV2.trigger.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('422')) })
    const { result } = renderHook(() => useGrantProposer())

    await act(async () => {
      await result.current.grantProposerRole({ proposer: PROPOSER, name: 'Nicole' })
    })
    expect(result.current.error?.message).toBe('422')

    act(() => result.current.reset())

    expect(result.current.error).toBeUndefined()
    expect(result.current.blockedReason).toBeUndefined()
  })
})
