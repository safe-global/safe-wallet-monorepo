import { faker } from '@faker-js/faker'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { fireEvent, render, waitFor } from '@/tests/test-utils'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as recoveryHooks from '@/features/recovery'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import SafeModules from '..'
import { zeroPadValue } from 'ethers'
import type { ReactElement } from 'react'
import type { RecoveryStateItem } from '@/features/recovery/services/recovery-state'

const buildDelayModifier = (overrides: Partial<RecoveryStateItem> = {}): RecoveryStateItem => ({
  address: faker.finance.ethereumAddress(),
  recoverers: [],
  expiry: 0n,
  delay: 0n,
  txNonce: 0n,
  queueNonce: 0n,
  queue: [],
  ...overrides,
})

const MOCK_MODULE_1 = zeroPadValue('0x01', 20)
const MOCK_MODULE_2 = zeroPadValue('0x02', 20)

type RemoveModuleFlowElement = ReactElement<{ address: string }>
type RemoveRecoveryFlowElement = ReactElement<{ delayModifier: { address: string } }>

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default({ children }: { children: (ok: boolean) => ReactElement }) {
    return children(true)
  },
}))

jest.mock('@/components/tx-flow/flows', () => ({
  __esModule: true,
  RemoveModuleFlow: ({ address }: { address: string }) => <div data-testid="remove-module-flow">{address}</div>,
  RemoveRecoveryFlow: ({ delayModifier }: { delayModifier: { address: string } }) => (
    <div data-testid="remove-recovery-flow">{delayModifier.address}</div>
  ),
}))

const renderWithTxContext = (ui: ReactElement, value?: Partial<TxModalContextType>) => {
  const txModalValue: TxModalContextType = {
    txFlow: undefined,
    setTxFlow: jest.fn(),
    setFullWidth: jest.fn(),
    ...value,
  }

  return {
    ...render(<TxModalContext.Provider value={txModalValue}>{ui}</TxModalContext.Provider>),
    txModalValue,
  }
}

describe('SafeModules', () => {
  const extendedSafeInfo = extendedSafeInfoBuilder().build()

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render placeholder label without any modules', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: extendedSafeInfo,
      safeAddress: '0x123',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const utils = render(<SafeModules />)
    await waitFor(() => expect(utils.getByText('No modules enabled')).toBeDefined())
  })

  it('should render module addresses for defined modules', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: {
        ...extendedSafeInfo,
        modules: [
          {
            value: MOCK_MODULE_1,
          },
          {
            value: MOCK_MODULE_2,
          },
        ],
      },
      safeAddress: '0x123',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const utils = render(<SafeModules />)
    await waitFor(() => expect(utils.getByText(MOCK_MODULE_1)).toBeDefined())
    await waitFor(() => expect(utils.getByText(MOCK_MODULE_2)).toBeDefined())
  })

  it('should open the remove module flow for a regular module', async () => {
    const setTxFlow = jest.fn()

    jest.spyOn(recoveryHooks, 'useDelayModifierByAddress').mockReturnValue({
      delayModifier: undefined,
      loading: false,
    })
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: {
        ...extendedSafeInfo,
        modules: [{ value: MOCK_MODULE_1 }],
      },
      safeAddress: '0x123',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const { getByTestId } = renderWithTxContext(<SafeModules />, { setTxFlow })

    fireEvent.click(getByTestId('module-remove-btn'))

    expect(setTxFlow).toHaveBeenCalledTimes(1)
    const txFlow = setTxFlow.mock.calls[0]?.[0] as RemoveModuleFlowElement
    expect(txFlow.props.address).toBe(MOCK_MODULE_1)
  })

  it('should open the remove recovery flow for a recovery module', async () => {
    const setTxFlow = jest.fn()
    const delayModifier = buildDelayModifier({ address: MOCK_MODULE_1 })

    jest.spyOn(recoveryHooks, 'useDelayModifierByAddress').mockReturnValue({
      delayModifier,
      loading: false,
    })
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: {
        ...extendedSafeInfo,
        modules: [{ value: MOCK_MODULE_1 }],
      },
      safeAddress: '0x123',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const { getByTestId } = renderWithTxContext(<SafeModules />, { setTxFlow })

    fireEvent.click(getByTestId('module-remove-btn'))

    expect(setTxFlow).toHaveBeenCalledTimes(1)
    const txFlow = setTxFlow.mock.calls[0]?.[0] as RemoveRecoveryFlowElement
    expect(txFlow.props.delayModifier).toBe(delayModifier)
  })

  it('should disable the remove button while recovery state is loading', async () => {
    const setTxFlow = jest.fn()

    jest.spyOn(recoveryHooks, 'useDelayModifierByAddress').mockReturnValue({
      delayModifier: undefined,
      loading: true,
    })
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: {
        ...extendedSafeInfo,
        modules: [{ value: MOCK_MODULE_1 }],
      },
      safeAddress: '0x123',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const { getByTestId } = renderWithTxContext(<SafeModules />, { setTxFlow })

    const button = getByTestId('module-remove-btn') as HTMLButtonElement
    expect(button.disabled).toBe(true)

    fireEvent.click(button)
    expect(setTxFlow).not.toHaveBeenCalled()
  })

  it('should enable the remove button once recovery state has loaded', async () => {
    const setTxFlow = jest.fn()

    jest.spyOn(recoveryHooks, 'useDelayModifierByAddress').mockReturnValue({
      delayModifier: undefined,
      loading: false,
    })
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: {
        ...extendedSafeInfo,
        modules: [{ value: MOCK_MODULE_1 }],
      },
      safeAddress: '0x123',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const { getByTestId } = renderWithTxContext(<SafeModules />, { setTxFlow })

    const button = getByTestId('module-remove-btn') as HTMLButtonElement
    expect(button.disabled).toBe(false)
  })
})
