import React from 'react'
import { faker } from '@faker-js/faker'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenType } from '@safe-global/store/gateway/types'
import {
  PSEUDO_APPROVAL_VALUES,
  type ApprovalInfo,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { FormProvider } from 'react-hook-form'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { renderWithStore, createTestStore, fireEvent, waitFor } from '@/src/tests/test-utils'
import { setDraft, type DraftTx } from '@/src/store/draftTxSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import type { Address } from '@/src/types/address'
import { setOutstandingRequest } from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'
import { rebuildDraftWithApproval } from '@/src/services/tx/rebuildDraftWithApproval'
import { EditApprovalFields, EditApprovalFooter, useEditApprovalForm } from './EditApprovalForm'

// Composes the pieces the same way EditApprovalSheet does; the sheet itself
// cannot be rendered in tests (the bottom-sheet jest mock renders null).
const EditApprovalForm = (props: {
  draft: DraftTx
  approval: ApprovalInfo & { balance?: string }
  safe: Pick<SafeState, 'owners' | 'threshold'>
}) => {
  const { formMethods, submitting, saveDisabled, onSave, onCancel } = useEditApprovalForm(props)
  return (
    <FormProvider {...formMethods}>
      <EditApprovalFields approval={props.approval} />
      <EditApprovalFooter submitting={submitting} saveDisabled={saveDisabled} onSave={onSave} onCancel={onCancel} />
    </FormProvider>
  )
}

const mockBack = jest.fn()
const mockIsFocused = jest.fn()
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: () => ({ back: mockBack }),
  useNavigation: () => ({ isFocused: mockIsFocused }),
}))

jest.mock('@/src/services/tx/rebuildDraftWithApproval', () => ({
  rebuildDraftWithApproval: jest.fn(),
}))

const mockRebuild = rebuildDraftWithApproval as jest.MockedFunction<typeof rebuildDraftWithApproval>

const tokenAddress = faker.finance.ethereumAddress()
const safe = { owners: [], threshold: 1 }

const approval: ApprovalInfo = {
  tokenInfo: { address: tokenAddress, symbol: 'USDC', decimals: 6, type: TokenType.ERC20 },
  tokenAddress,
  spender: faker.finance.ethereumAddress(),
  amount: 100_000_000n,
  amountFormatted: '100',
  method: 'approve',
  transactionIndex: 0,
}

const draft: DraftTx = {
  chainId: '1',
  safeAddress: faker.finance.ethereumAddress(),
  buildParams: { to: tokenAddress, value: '0', data: '0xdata', nonce: 0 },
  safeTxHash: '0xoldhash',
  txDetails: { txId: '0xoldhash' } as TransactionDetails,
}

const setupStore = () => {
  const store = createTestStore()
  store.dispatch(setActiveSafe({ chainId: '1', address: draft.safeAddress as Address }))
  store.dispatch(setDraft(draft))
  store.dispatch(
    setOutstandingRequest({
      safeTxHash: draft.safeTxHash,
      topic: 't',
      id: 1,
      method: 'eth_sendTransaction',
      chainId: '1',
      safeAddress: draft.safeAddress,
    }),
  )
  return store
}

describe('EditApprovalForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRebuild.mockResolvedValue('0xnewhash')
    mockIsFocused.mockReturnValue(true)
  })

  it('prefills the current approval amount', () => {
    const store = setupStore()
    const { getByTestId } = renderWithStore(<EditApprovalForm draft={draft} approval={approval} safe={safe} />, store)

    expect(getByTestId('input-approval-amount').props.value).toEqual('100')
  })

  it('shows the token balance below the amount input', () => {
    const store = setupStore()
    const { getByText, queryByTestId, rerender } = renderWithStore(
      <EditApprovalForm draft={draft} approval={{ ...approval, balance: '250000000' }} safe={safe} />,
      store,
    )

    expect(getByText('Balance: 250 USDC')).toBeTruthy()

    rerender(<EditApprovalForm draft={draft} approval={approval} safe={safe} />)
    expect(queryByTestId('approval-token-balance')).toBeNull()
  })

  it('rebuilds the draft with the new amount and hands state over to the new hash', async () => {
    const store = setupStore()
    const { getByTestId } = renderWithStore(<EditApprovalForm draft={draft} approval={approval} safe={safe} />, store)

    fireEvent.changeText(getByTestId('input-approval-amount'), '250')
    fireEvent.press(getByTestId('save-approval-button'))

    await waitFor(() => expect(mockBack).toHaveBeenCalled())

    expect(mockRebuild).toHaveBeenCalledWith(expect.objectContaining({ draft, approval, newValue: '250', safe }))

    const state = store.getState()
    expect(state.draftTx.drafts['0xoldhash']).toBeUndefined()
    expect(state.draftTx.redirects?.['0xoldhash']).toEqual('0xnewhash')
    expect(state.walletKit.outstandingRequests['0xoldhash']).toBeUndefined()
    expect(state.walletKit.outstandingRequests['0xnewhash']).toBeDefined()
  })

  it('clears the amount and shows the Unlimited placeholder when the toggle is switched on', () => {
    const store = setupStore()
    const { getByTestId } = renderWithStore(<EditApprovalForm draft={draft} approval={approval} safe={safe} />, store)

    fireEvent.changeText(getByTestId('input-approval-amount'), '250')
    fireEvent(getByTestId('switch-unlimited-approval'), 'onValueChange', true)

    expect(getByTestId('input-approval-amount').props.value).toEqual('')
    expect(getByTestId('input-approval-amount').props.placeholder).toEqual('Unlimited')
    expect(getByTestId('switch-unlimited-approval').props.value).toBe(true)
  })

  it('switches unlimited off when the amount input is focused', () => {
    const store = setupStore()
    const { getByTestId } = renderWithStore(<EditApprovalForm draft={draft} approval={approval} safe={safe} />, store)

    fireEvent(getByTestId('switch-unlimited-approval'), 'onValueChange', true)
    expect(getByTestId('switch-unlimited-approval').props.value).toBe(true)

    fireEvent(getByTestId('input-approval-amount'), 'focus', { nativeEvent: { target: 1 } })
    expect(getByTestId('switch-unlimited-approval').props.value).toBe(false)
  })

  it('does not save an invalid amount', async () => {
    const store = setupStore()
    const { getByTestId, getByText } = renderWithStore(
      <EditApprovalForm draft={draft} approval={approval} safe={safe} />,
      store,
    )

    fireEvent.changeText(getByTestId('input-approval-amount'), '')

    await waitFor(() => expect(getByText('The value must be a number')).toBeTruthy())

    fireEvent.press(getByTestId('save-approval-button'))
    expect(mockRebuild).not.toHaveBeenCalled()
  })

  it('does not save a zero amount', async () => {
    const store = setupStore()
    const { getByTestId, getByText } = renderWithStore(
      <EditApprovalForm draft={draft} approval={approval} safe={safe} />,
      store,
    )

    fireEvent.changeText(getByTestId('input-approval-amount'), '0')

    await waitFor(() => expect(getByText('The value must be greater than 0')).toBeTruthy())

    fireEvent.press(getByTestId('save-approval-button'))
    expect(mockRebuild).not.toHaveBeenCalled()
  })

  it('submits the unlimited pseudo value when the toggle is on', async () => {
    const store = setupStore()
    const { getByTestId } = renderWithStore(<EditApprovalForm draft={draft} approval={approval} safe={safe} />, store)

    fireEvent(getByTestId('switch-unlimited-approval'), 'onValueChange', true)
    fireEvent.press(getByTestId('save-approval-button'))

    await waitFor(() => expect(mockBack).toHaveBeenCalled())

    expect(mockRebuild).toHaveBeenCalledWith(expect.objectContaining({ newValue: PSEUDO_APPROVAL_VALUES.UNLIMITED }))
  })

  it('skips the trailing back() when the sheet was dismissed mid-save but still hands over state', async () => {
    mockIsFocused.mockReturnValue(false)
    const store = setupStore()
    const { getByTestId } = renderWithStore(<EditApprovalForm draft={draft} approval={approval} safe={safe} />, store)

    fireEvent.changeText(getByTestId('input-approval-amount'), '250')
    fireEvent.press(getByTestId('save-approval-button'))

    await waitFor(() => expect(mockRebuild).toHaveBeenCalled())

    expect(mockBack).not.toHaveBeenCalled()
    const state = store.getState()
    expect(state.draftTx.redirects?.['0xoldhash']).toEqual('0xnewhash')
    expect(state.walletKit.outstandingRequests['0xnewhash']).toBeDefined()
  })

  it('keeps everything keyed by the old hash when the rebuilt hash is unchanged', async () => {
    mockRebuild.mockResolvedValue(draft.safeTxHash)
    const store = setupStore()
    const { getByTestId } = renderWithStore(<EditApprovalForm draft={draft} approval={approval} safe={safe} />, store)

    fireEvent.press(getByTestId('save-approval-button'))

    await waitFor(() => expect(mockBack).toHaveBeenCalled())

    const state = store.getState()
    expect(state.draftTx.drafts['0xoldhash']).toBeDefined()
    expect(state.draftTx.redirects).toEqual({})
    expect(state.walletKit.outstandingRequests['0xoldhash']).toBeDefined()
  })
})
