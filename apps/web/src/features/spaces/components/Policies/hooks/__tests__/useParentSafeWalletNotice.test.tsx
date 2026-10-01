import type { ReactNode } from 'react'
import { act, renderHook } from '@/tests/test-utils'
import { TxModalContext } from '@/components/tx-flow'
import { buildSafeAccountId } from '../../SafeAccountSelector/utils'
import type { SafeAccountOption } from '../../SafeAccountSelector/types'
import { useParentSafeWallet } from '../useParentSafeWallet'
import { useParentSafeWalletNotice } from '../useParentSafeWalletNotice'

jest.mock('../useParentSafeWallet', () => ({ useParentSafeWallet: jest.fn() }))
jest.mock('@/hooks/useUrlSpaceId', () => ({
  ...jest.requireActual('@/hooks/useUrlSpaceId'),
  useUrlSpaceId: () => mockSpaceId,
}))

const mockUseParentSafeWallet = jest.mocked(useParentSafeWallet)

const mockSpaceId = '7a2f1c3e-5b4d-4e6f-8a9b-0c1d2e3f4a5b'

const SAFE = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const PARENT = '0x2222222222222222222222222222222222222222'
const COPY = { title: 'Add this proposer on the Safe account level', action: 'grant this role' }

const treasury: SafeAccountOption = {
  id: buildSafeAccountId('137', SAFE),
  chainId: '137',
  address: SAFE,
  name: 'Treasury',
  eligibility: 'signer',
  chain: { chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
}

const renderNotice = (account: SafeAccountOption | undefined, addressBook = {}) => {
  const setTxFlow = jest.fn()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      {children}
    </TxModalContext.Provider>
  )
  const rendered = renderHook(() => useParentSafeWalletNotice(account, COPY), {
    wrapper,
    initialReduxState: { addressBook },
  })
  return { ...rendered, setTxFlow }
}

describe('useParentSafeWalletNotice', () => {
  beforeEach(() => {
    mockUseParentSafeWallet.mockReturnValue({ parentSafeAddress: PARENT, isChecking: false })
  })

  it('builds the notice from the copy, the address book and the Safe settings link', () => {
    const { result } = renderNotice(treasury, { '137': { [PARENT]: 'Ops' } })

    expect(result.current.notice).toEqual({
      ...COPY,
      safeName: 'Treasury',
      parentSafeName: 'Ops',
      settingsHref: { pathname: '/settings/setup', query: { safe: `matic:${SAFE}`, spaceId: mockSpaceId } },
      onNavigate: expect.any(Function),
    })
    expect(mockUseParentSafeWallet).toHaveBeenCalledWith('137')
  })

  it('falls back to shortened addresses when neither Safe has a name', () => {
    const { result } = renderNotice({ ...treasury, name: undefined })

    expect(result.current.notice).toMatchObject({ safeName: '0xAAAA...AAaA', parentSafeName: '0x2222...2222' })
  })

  it('closes the flow without the discard prompt when the link is used', () => {
    const { result, setTxFlow } = renderNotice(treasury)

    act(() => result.current.notice?.onNavigate?.())

    expect(setTxFlow).toHaveBeenCalledWith(undefined, undefined, false)
  })

  it('omits the settings link when the chain has no short name', () => {
    const { result } = renderNotice({ ...treasury, chain: undefined })

    expect(result.current.notice?.settingsHref).toBeUndefined()
  })

  it('returns no notice while nothing is picked or the wallet is not a parent Safe', () => {
    expect(renderNotice(undefined).result.current).toEqual({ isChecking: false })

    mockUseParentSafeWallet.mockReturnValue({ parentSafeAddress: undefined, isChecking: true })
    expect(renderNotice(treasury).result.current).toEqual({ isChecking: true })
  })
})
