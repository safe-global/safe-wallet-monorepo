import { render } from '@/src/tests/test-utils'
import { formatArrayValue } from './arrayValue'
import { DataDecodedParameter } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

type LabelValueItem = {
  label: string | React.ReactNode
  value?: string
  render?: () => React.ReactNode
  direction?: string
  alignItems?: string
}

describe('formatArrayValue', () => {
  describe('with string array values', () => {
    it('returns ListTableItem with label containing name and type', () => {
      const param: DataDecodedParameter = {
        name: 'recipients',
        type: 'address[]',
        value: ['0x1234567890123456789012345678901234567890'],
      }

      const result = formatArrayValue(param) as LabelValueItem

      expect(result.label).toBeDefined()
      expect(result.direction).toBe('column')
      expect(result.alignItems).toBe('flex-start')
    })

    it('renders the label with parameter name and type', () => {
      const param: DataDecodedParameter = {
        name: 'amounts',
        type: 'uint256[]',
        value: ['100', '200'],
      }

      const result = formatArrayValue(param) as LabelValueItem
      const { getByText } = render(result.label as React.ReactElement)

      expect(getByText('amounts')).toBeTruthy()
      expect(getByText('uint256[]')).toBeTruthy()
    })

    it('renders simple string array values', () => {
      const param: DataDecodedParameter = {
        name: 'values',
        type: 'uint256[]',
        value: ['100', '200', '300'],
      }

      const result = formatArrayValue(param) as LabelValueItem
      const { getByText, getAllByTestId } = render(result.render?.() as React.ReactElement)

      expect(getByText('[')).toBeTruthy()
      expect(getByText(']')).toBeTruthy()
      expect(getAllByTestId('copy-button').length).toBe(3)
    })

    it('shortens long string values', () => {
      const longValue = '0x1234567890abcdef1234567890abcdef1234567890abcdef'
      const param: DataDecodedParameter = {
        name: 'data',
        type: 'bytes[]',
        value: [longValue],
      }

      const result = formatArrayValue(param) as LabelValueItem
      const { queryByText } = render(result.render?.() as React.ReactElement)

      expect(queryByText(longValue)).toBeNull()
    })
  })

  describe('with nested array values', () => {
    it('renders nested arrays recursively', () => {
      const param: DataDecodedParameter = {
        name: 'matrix',
        type: 'uint256[][]',
        value: [
          ['1', '2'],
          ['3', '4'],
        ] as unknown as string[],
      }

      const result = formatArrayValue(param) as LabelValueItem
      const { getAllByText } = render(result.render?.() as React.ReactElement)

      const brackets = getAllByText('[')
      expect(brackets.length).toBeGreaterThan(1)
    })
  })

  describe('with single string value', () => {
    it('renders a single string value with copy button', () => {
      const param: DataDecodedParameter = {
        name: 'singleItem',
        type: 'string[]',
        value: ['hello'],
      }

      const result = formatArrayValue(param) as LabelValueItem
      const { getByTestId, getByText } = render(result.render?.() as React.ReactElement)

      expect(getByText('[')).toBeTruthy()
      expect(getByTestId('copy-button')).toBeTruthy()
    })
  })

  describe('with empty array', () => {
    it('renders empty brackets for empty array', () => {
      const param: DataDecodedParameter = {
        name: 'empty',
        type: 'address[]',
        value: [],
      }

      const result = formatArrayValue(param) as LabelValueItem
      const { getByText } = render(result.render?.() as React.ReactElement)

      expect(getByText('[')).toBeTruthy()
      expect(getByText(']')).toBeTruthy()
    })
  })
})
