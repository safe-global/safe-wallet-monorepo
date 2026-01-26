import { screen, waitFor, act, getByText, fireEvent } from '@testing-library/react'

import { render } from '../../test-utils'
import { ContractInterface } from '../../typings/models'
import SolidityForm, { CONTRACT_METHOD_INDEX_FIELD_NAME, TO_ADDRESS_FIELD_NAME } from './SolidityForm'

// Axios is bundled as ESM module which is not directly compatible with Jest
// https://jestjs.io/docs/ecmascript-modules
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}))

const testAddressMethod = {
  inputs: [{ internalType: 'address', name: 'newValue', type: 'address' }],
  name: 'testAddressValue',
  payable: false,
}

const testBooleanMethod = {
  inputs: [{ internalType: 'bool', name: 'newValue', type: 'bool' }],
  name: 'testBooleanValue',
  payable: false,
}

const initialValues = {
  [TO_ADDRESS_FIELD_NAME]: '0x680cde08860141F9D223cE4E620B10Cd6741037E',
  [CONTRACT_METHOD_INDEX_FIELD_NAME]: '0',
}

const testContract: ContractInterface = {
  methods: [testAddressMethod, testBooleanMethod],
}

describe('<SolidityForm>', () => {
  it('Renders SolidityForm component', async () => {
    render(
      <SolidityForm
        id={'test-form'}
        onSubmit={jest.fn()}
        getAddressFromDomain={jest.fn()}
        initialValues={initialValues}
        contract={testContract}
        nativeCurrencySymbol={'ETH'}
        networkPrefix={'rin:'}
        showHexEncodedData={false}
      >
        <button type="submit">submit</button>
      </SolidityForm>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('test-form')).toBeInTheDocument()
    })
  })

  it('Show correct field contract params', async () => {
    render(
      <SolidityForm
        id={'test-form'}
        onSubmit={jest.fn()}
        getAddressFromDomain={jest.fn()}
        initialValues={initialValues}
        contract={testContract}
        nativeCurrencySymbol={'ETH'}
        networkPrefix={'rin:'}
        showHexEncodedData={false}
      >
        <button type="submit">submit</button>
      </SolidityForm>,
    )

    let input: ReturnType<typeof screen.getByRole>

    // testAddressMethod is selected by default
    await waitFor(() => {
      input = screen.getByRole('combobox')
      expect(input).toHaveValue('testAddressValue')
    })

    act(() => {
      fireEvent.change(input, { target: { value: 'testBooleanVa' } })
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    // now testBooleanMethod is selected by default
    await waitFor(() => {
      // expect(input).toHaveValue('testBooleanValue')
    })
  })

  // see https://github.com/safe-global/safe-react-apps/issues/450
  xit('Avoid collisions between parameters with the same name and different types when changing contract methods', async () => {
    render(
      <SolidityForm
        id={'test-form'}
        onSubmit={jest.fn()}
        getAddressFromDomain={jest.fn()}
        initialValues={initialValues}
        contract={testContract}
        nativeCurrencySymbol={'ETH'}
        networkPrefix={'rin:'}
        showHexEncodedData={false}
      >
        <button type="submit">submit</button>
      </SolidityForm>,
    )

    // testAddressMethod is selected by default
    await waitFor(() => {
      expect(screen.queryByText('testAddressValue')).toBeInTheDocument()
      expect(screen.queryByText('testBooleanValue')).not.toBeInTheDocument()

      // no value by default
      expect(screen.getByTestId('contract-field-newValue')).toHaveValue('')
    })

    // we update the address field value
    await waitFor(() => {
      fireEvent.change(screen.getByTestId('contract-field-newValue'), {
        target: { value: '0x680cde08860141F9D223cE4E620B10Cd6741037E' },
      })
    })

    // we update the address field value
    await waitFor(() => {
      expect(screen.getByTestId('contract-field-newValue')).toHaveValue('0x680cde08860141F9D223cE4E620B10Cd6741037E')
    })

    // selects a different contract method
    await waitFor(() => {
      const contractMethodSelectorNode = screen.getByTestId('contract-method-selector')

      // opens the contract method selector
      fireEvent.mouseDown(contractMethodSelectorNode)

      // we select the boolean contract method
      const selectorModal = screen.getByTestId('menu-contractMethodIndex')
      fireEvent.click(getByText(selectorModal, 'testBooleanValue'))
    })

    // the issue is not present (true value as default for booleans)
    await waitFor(() => {
      expect(screen.getByTestId('contract-field-newValue-input')).toHaveValue('true')
    })

    // address value again if we select testAddressMethod again
    await waitFor(() => {
      const contractMethodSelectorNode = screen.getByTestId('contract-method-selector')

      // opens the contract method selector
      fireEvent.mouseDown(contractMethodSelectorNode)

      // we select the boolean contract method
      const selectorModal = screen.getByTestId('menu-contractMethodIndex')
      fireEvent.click(getByText(selectorModal, 'testAddressValue'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('contract-field-newValue')).toHaveValue('0x680cde08860141F9D223cE4E620B10Cd6741037E')
    })
  })
})
