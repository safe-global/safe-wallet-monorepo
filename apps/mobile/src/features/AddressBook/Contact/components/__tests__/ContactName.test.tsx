import React from 'react'
import { render } from '@/src/tests/test-utils'
import { ContactName } from '../ContactName'

describe('ContactName', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as const
  const mockName = 'John Doe'

  it('should render name when provided', () => {
    const { getByText } = render(<ContactName name={mockName} address={mockAddress} />)

    expect(getByText(mockName)).toBeTruthy()
  })

  it('should render name text when provided', () => {
    const { getByText } = render(<ContactName name={mockName} address={mockAddress} />)

    const nameElement = getByText(mockName)
    expect(nameElement).toBeTruthy()
  })

  it('should render EthAddress component when name is not provided', () => {
    const { queryByText } = render(<ContactName address={mockAddress} />)

    // Name should not be rendered
    expect(queryByText(mockName)).toBeFalsy()
  })

  it('should render EthAddress component when name is undefined', () => {
    const { queryByText } = render(<ContactName name={undefined} address={mockAddress} />)

    // Name should not be rendered when undefined
    expect(queryByText(mockName)).toBeFalsy()
  })

  it('should render EthAddress component when name is empty string', () => {
    const { queryByText } = render(<ContactName name="" address={mockAddress} />)

    // Name should not be rendered when empty
    expect(queryByText('')).toBeFalsy()
  })

  it('should render name when textProps are provided', () => {
    const customTextProps = {
      fontSize: '$5',
      color: '$red',
    }

    const { getByText } = render(<ContactName name={mockName} address={mockAddress} textProps={customTextProps} />)

    const nameElement = getByText(mockName)
    expect(nameElement).toBeTruthy()
  })

  it('should use address when name is falsy', () => {
    const falsyValues: (string | undefined)[] = [undefined, '']

    falsyValues.forEach((falsyName) => {
      const { queryByText } = render(<ContactName name={falsyName} address={mockAddress} />)

      // Should not render any falsy name values
      if (falsyName) {
        expect(queryByText(falsyName)).toBeFalsy()
      }
    })
  })
})
