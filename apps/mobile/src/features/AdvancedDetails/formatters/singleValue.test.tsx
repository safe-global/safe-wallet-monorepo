import { render } from '@/src/tests/test-utils'
import { faker } from '@faker-js/faker'
import { DisplayValue, formatValueTemplate, characterDisplayLimit } from './singleValue'
import { DataDecodedParameter } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

type LabelValueItem = {
  label: string | React.ReactNode
  value?: string
  render?: () => React.ReactNode
}

describe('characterDisplayLimit', () => {
  it('is set to 15', () => {
    expect(characterDisplayLimit).toBe(15)
  })
})

describe('DisplayValue', () => {
  describe('with address type', () => {
    it('renders address with identicon', () => {
      const address = faker.finance.ethereumAddress()
      const { getByTestId } = render(<DisplayValue type="address" value={address} />)

      expect(getByTestId('identicon-image-container')).toBeTruthy()
    })

    it('renders EthAddress component for address', () => {
      const address = faker.finance.ethereumAddress()
      const { getByText } = render(<DisplayValue type="address" value={address} />)

      const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
      expect(getByText(shortAddress)).toBeTruthy()
    })
  })

  describe('with hash type', () => {
    it('renders hash with identicon', () => {
      const hash = faker.string.hexadecimal({ length: 64, prefix: '0x' })
      const { getByTestId } = render(<DisplayValue type="hash" value={hash} />)

      expect(getByTestId('identicon-image-container')).toBeTruthy()
    })
  })

  describe('with bytes type', () => {
    it('renders shortened bytes value', () => {
      const bytes = faker.string.hexadecimal({ length: 100, prefix: '0x' })
      const { queryByText } = render(<DisplayValue type="bytes" value={bytes} />)

      expect(queryByText(bytes)).toBeNull()
    })

    it('includes copy button for bytes', () => {
      const bytes = faker.string.hexadecimal({ length: 100, prefix: '0x' })
      const { getByTestId } = render(<DisplayValue type="bytes" value={bytes} />)

      expect(getByTestId('copy-button')).toBeTruthy()
    })
  })

  describe('with rawData type', () => {
    it('renders shortened rawData value', () => {
      const rawData = faker.string.hexadecimal({ length: 100, prefix: '0x' })
      const { queryByText } = render(<DisplayValue type="rawData" value={rawData} />)

      expect(queryByText(rawData)).toBeNull()
    })
  })

  describe('with default type', () => {
    it('renders short values directly without copy button', () => {
      const shortValue = '12345'
      const { getByText, queryByTestId } = render(<DisplayValue type="uint256" value={shortValue} />)

      expect(getByText(shortValue)).toBeTruthy()
      expect(queryByTestId('copy-button')).toBeNull()
    })

    it('shortens long values and shows copy button', () => {
      const longValue = '123456789012345678901234567890'
      const { queryByText, getByTestId } = render(<DisplayValue type="uint256" value={longValue} />)

      expect(queryByText(longValue)).toBeNull()
      expect(getByTestId('copy-button')).toBeTruthy()
    })

    it('renders value at exactly characterDisplayLimit without copy button', () => {
      const exactLengthValue = 'a'.repeat(characterDisplayLimit)
      const { getByText, queryByTestId } = render(<DisplayValue type="string" value={exactLengthValue} />)

      expect(getByText(exactLengthValue)).toBeTruthy()
      expect(queryByTestId('copy-button')).toBeNull()
    })

    it('renders value one character over limit with copy button', () => {
      const overLimitValue = 'a'.repeat(characterDisplayLimit + 1)
      const { queryByText, getByTestId } = render(<DisplayValue type="string" value={overLimitValue} />)

      expect(queryByText(overLimitValue)).toBeNull()
      expect(getByTestId('copy-button')).toBeTruthy()
    })
  })
})

describe('formatValueTemplate', () => {
  describe('with valid string value', () => {
    it('returns ListTableItem with rendered label', () => {
      const param: DataDecodedParameter = {
        name: 'amount',
        type: 'uint256',
        value: '1000000000000000000',
      }

      const result = formatValueTemplate(param) as LabelValueItem

      expect(result.label).toBeDefined()
      expect(result.render).toBeDefined()
    })

    it('renders label with parameter name and type', () => {
      const param: DataDecodedParameter = {
        name: 'recipient',
        type: 'address',
        value: faker.finance.ethereumAddress(),
      }

      const result = formatValueTemplate(param) as LabelValueItem
      const { getByText } = render(result.label as React.ReactElement)

      expect(getByText('recipient')).toBeTruthy()
      expect(getByText('address')).toBeTruthy()
    })

    it('wraps value in InfoSheet component', () => {
      const param: DataDecodedParameter = {
        name: 'data',
        type: 'bytes',
        value: '0x1234',
      }

      const result = formatValueTemplate(param) as LabelValueItem
      const rendered = result.render?.()

      expect(rendered).toBeDefined()
    })
  })

  describe('with undefined value', () => {
    it('returns ListTableItem with only label', () => {
      const param: DataDecodedParameter = {
        name: 'optionalParam',
        type: 'bytes',
        value: undefined as unknown as string,
      }

      const result = formatValueTemplate(param) as LabelValueItem

      expect(result.label).toBe('optionalParam')
      expect(result.render).toBeUndefined()
    })
  })

  describe('with non-string value', () => {
    it('returns ListTableItem with only label for array value', () => {
      const param: DataDecodedParameter = {
        name: 'arrayParam',
        type: 'uint256[]',
        value: ['1', '2', '3'],
      }

      const result = formatValueTemplate(param) as LabelValueItem

      expect(result.label).toBe('arrayParam')
      expect(result.render).toBeUndefined()
    })

    it('returns ListTableItem with only label for object value', () => {
      const param: DataDecodedParameter = {
        name: 'tupleParam',
        type: 'tuple',
        value: { a: '1', b: '2' } as unknown as string,
      }

      const result = formatValueTemplate(param) as LabelValueItem

      expect(result.label).toBe('tupleParam')
      expect(result.render).toBeUndefined()
    })
  })

  describe('with numeric value converted to string', () => {
    it('handles number value by converting to string', () => {
      const param: DataDecodedParameter = {
        name: 'count',
        type: 'uint8',
        value: '42',
      }

      const result = formatValueTemplate(param) as LabelValueItem

      expect(result.render).toBeDefined()
    })
  })
})
