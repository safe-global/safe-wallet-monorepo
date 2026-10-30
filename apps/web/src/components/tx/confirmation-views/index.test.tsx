import { faker } from '@faker-js/faker'
import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation, SettingsInfoType, TransactionInfoType } from '@safe-global/store/gateway/types'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { fakerChecksummedAddress, render } from '@/tests/test-utils'
import { getLatestSpendingLimitAddress } from '@/features/spending-limits/services'
import ConfirmationView from '.'

const CHAIN_ID = '11155111'

jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '11155111' }))
jest.mock('@/components/transactions/TxDetails/Summary', () => ({ __esModule: true, default: () => null }))

const moduleAddress = getLatestSpendingLimitAddress(CHAIN_ID)!
const spender = faker.finance.ethereumAddress()
const token = faker.finance.ethereumAddress()

const action = (to: string, method: string, values: string[]) => ({
  operation: Operation.CALL,
  to,
  value: '0',
  data: '0x',
  dataDecoded: { method, parameters: values.map((value) => ({ name: '', type: 'address', value })) },
})

const preview = (actions: ReturnType<typeof action>[]): TransactionPreview =>
  ({
    txInfo: {
      type: TransactionInfoType.CUSTOM,
      methodName: 'multiSend',
      to: { value: faker.finance.ethereumAddress() },
      dataSize: '0',
      value: '0',
      isCancellation: false,
      actionCount: actions.length,
    },
    txData: {
      to: { value: faker.finance.ethereumAddress() },
      operation: Operation.DELEGATE,
      dataDecoded: {
        method: 'multiSend',
        parameters: [{ name: 'transactions', type: 'bytes', value: '0x', valueDecoded: actions }],
      },
    },
  }) as unknown as TransactionPreview

const safeInterface = Safe__factory.createInterface()
const target = fakerChecksummedAddress()
const owner = fakerChecksummedAddress()

const settingsChange = (settingsInfo: object, hexData = '0x'): TransactionPreview =>
  ({
    txInfo: { type: TransactionInfoType.SETTINGS_CHANGE, settingsInfo },
    txData: { to: { value: fakerChecksummedAddress() }, value: '0', operation: Operation.CALL, hexData },
  }) as unknown as TransactionPreview

describe('ConfirmationView', () => {
  it('summarises a spending limit batch for the signer', () => {
    const { getByTestId, getByText } = render(
      <ConfirmationView
        txPreview={preview([
          action(moduleAddress, 'addDelegate', [spender]),
          action(moduleAddress, 'setAllowance', [spender, token, '1', '0', '0']),
        ])}
      />,
    )

    expect(getByTestId('spending-limit-batch-summary')).toBeInTheDocument()
    expect(getByText('Modify spending limit:')).toBeInTheDocument()
  })

  it('leaves a batch with other calls undecoded as a spending limit', () => {
    const { queryByTestId } = render(
      <ConfirmationView
        txPreview={preview([
          action(moduleAddress, 'setAllowance', [spender, token, '1', '0', '0']),
          action(token, 'transfer', [spender, '1']),
        ])}
      />,
    )

    expect(queryByTestId('spending-limit-batch-summary')).not.toBeInTheDocument()
  })

  it('hides the summary when the flow opts out of decoded data', () => {
    const { queryByTestId } = render(
      <ConfirmationView
        withDecodedData={false}
        txPreview={preview([action(moduleAddress, 'setAllowance', [spender, token, '1', '0', '0'])])}
      />,
    )

    expect(queryByTestId('spending-limit-batch-summary')).not.toBeInTheDocument()
  })

  it.each([
    ['Enable module:', { type: SettingsInfoType.ENABLE_MODULE, module: { value: target } }],
    ['Disable module:', { type: SettingsInfoType.DISABLE_MODULE, module: { value: target } }],
    ['Set guard:', { type: SettingsInfoType.SET_GUARD, guard: { value: target } }],
    ['Change implementation:', { type: SettingsInfoType.CHANGE_IMPLEMENTATION, implementation: { value: target } }],
    ['Set fallback handler:', { type: SettingsInfoType.SET_FALLBACK_HANDLER, handler: { value: target } }],
    ['Set module guard:', { type: SettingsInfoType.SET_MODULE_GUARD, moduleGuard: { value: target } }],
  ])('shows "%s" with the target address to the signer', (title, settingsInfo) => {
    const { getByText } = render(<ConfirmationView txPreview={settingsChange(settingsInfo)} />)

    expect(getByText(title)).toBeInTheDocument()
    expect(getByText(target)).toBeInTheDocument()
  })

  it.each([
    ['Delete guard', SettingsInfoType.DELETE_GUARD],
    ['Delete module guard', SettingsInfoType.DELETE_MODULE_GUARD],
  ])('shows "%s" to the signer', (title, type) => {
    const { getByText } = render(<ConfirmationView txPreview={settingsChange({ type })} />)

    expect(getByText(title)).toBeInTheDocument()
  })

  it.each([
    [
      SettingsInfoType.ADD_OWNER,
      { owner: { value: owner }, threshold: 1 },
      safeInterface.encodeFunctionData('addOwnerWithThreshold', [owner, 1]),
    ],
    [
      SettingsInfoType.REMOVE_OWNER,
      { owner: { value: owner }, threshold: 1 },
      safeInterface.encodeFunctionData('removeOwner', [target, owner, 1]),
    ],
    [
      SettingsInfoType.SWAP_OWNER,
      { oldOwner: { value: owner }, newOwner: { value: target } },
      safeInterface.encodeFunctionData('swapOwner', [target, owner, target]),
    ],
    [SettingsInfoType.CHANGE_THRESHOLD, { threshold: 1 }, safeInterface.encodeFunctionData('changeThreshold', [1])],
  ])('shows the new signer setup for %s', async (type, fields, hexData) => {
    const { findByText } = render(<ConfirmationView txPreview={settingsChange({ type, ...fields }, hexData)} />)

    expect(await findByText('Signers')).toBeInTheDocument()
  })
})
