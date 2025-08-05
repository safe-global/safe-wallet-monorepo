import React from 'react'
import { render } from '@/src/tests/test-utils'
import { NetworkSelectorHeader } from '../NetworkSelectorHeader'

describe('NetworkSelectorHeader', () => {
  const defaultProps = {
    isReadOnly: false,
    isAllChainsSelected: false,
    selectedChainCount: 1,
  }

  describe('Title component', () => {
    it('should display "Select Networks" when not read-only', () => {
      const { getByText } = render(<NetworkSelectorHeader {...defaultProps} isReadOnly={false} />)

      expect(getByText('Select Networks')).toBeTruthy()
    })

    it('should display "Available Networks" when read-only', () => {
      const { getByText } = render(<NetworkSelectorHeader {...defaultProps} isReadOnly={true} />)

      expect(getByText('Available Networks')).toBeTruthy()
    })
  })

  describe('Subtitle component - Read-only mode', () => {
    it('should display "Contact is available on all networks" when all chains are selected', () => {
      const { getByText } = render(
        <NetworkSelectorHeader {...defaultProps} isReadOnly={true} isAllChainsSelected={true} />,
      )

      expect(getByText('Contact is available on all networks')).toBeTruthy()
    })

    it('should display singular "network" for one selected network', () => {
      const { getByText } = render(<NetworkSelectorHeader {...defaultProps} isReadOnly={true} selectedChainCount={1} />)

      expect(getByText('Contact is available on 1 network')).toBeTruthy()
    })

    it('should display plural "networks" for multiple selected networks', () => {
      const { getByText } = render(<NetworkSelectorHeader {...defaultProps} isReadOnly={true} selectedChainCount={3} />)

      expect(getByText('Contact is available on 3 networks')).toBeTruthy()
    })

    it('should display plural "networks" for zero selected networks', () => {
      const { getByText } = render(<NetworkSelectorHeader {...defaultProps} isReadOnly={true} selectedChainCount={0} />)

      expect(getByText('Contact is available on 0 networks')).toBeTruthy()
    })
  })

  describe('Subtitle component - Editable mode', () => {
    it('should display "Contact available on all networks" when all chains are selected', () => {
      const { getByText } = render(
        <NetworkSelectorHeader {...defaultProps} isReadOnly={false} isAllChainsSelected={true} />,
      )

      expect(getByText('Contact available on all networks')).toBeTruthy()
    })

    it('should display singular "network" for one selected network', () => {
      const { getByText } = render(
        <NetworkSelectorHeader {...defaultProps} isReadOnly={false} selectedChainCount={1} />,
      )

      expect(getByText('Contact available on 1 network')).toBeTruthy()
    })

    it('should display plural "networks" for multiple selected networks', () => {
      const { getByText } = render(
        <NetworkSelectorHeader {...defaultProps} isReadOnly={false} selectedChainCount={5} />,
      )

      expect(getByText('Contact available on 5 networks')).toBeTruthy()
    })

    it('should display plural "networks" for zero selected networks', () => {
      const { getByText } = render(
        <NetworkSelectorHeader {...defaultProps} isReadOnly={false} selectedChainCount={0} />,
      )

      expect(getByText('Contact available on 0 networks')).toBeTruthy()
    })
  })

  describe('Text differences between modes', () => {
    it('should use different text prefixes for read-only vs editable modes', () => {
      const readOnlyProps = { ...defaultProps, isReadOnly: true, selectedChainCount: 2 }
      const editableProps = { ...defaultProps, isReadOnly: false, selectedChainCount: 2 }

      const { getByText: getByTextReadOnly } = render(<NetworkSelectorHeader {...readOnlyProps} />)
      const { getByText: getByTextEditable } = render(<NetworkSelectorHeader {...editableProps} />)

      expect(getByTextReadOnly('Contact is available on 2 networks')).toBeTruthy()
      expect(getByTextEditable('Contact available on 2 networks')).toBeTruthy()
    })

    it('should use different text for all networks in both modes', () => {
      const readOnlyProps = { ...defaultProps, isReadOnly: true, isAllChainsSelected: true }
      const editableProps = { ...defaultProps, isReadOnly: false, isAllChainsSelected: true }

      const { getByText: getByTextReadOnly } = render(<NetworkSelectorHeader {...readOnlyProps} />)
      const { getByText: getByTextEditable } = render(<NetworkSelectorHeader {...editableProps} />)

      expect(getByTextReadOnly('Contact is available on all networks')).toBeTruthy()
      expect(getByTextEditable('Contact available on all networks')).toBeTruthy()
    })
  })

  describe('Component structure', () => {
    it('should render both title and subtitle', () => {
      const { getByText } = render(<NetworkSelectorHeader {...defaultProps} />)

      expect(getByText('Select Networks')).toBeTruthy()
      expect(getByText('Contact available on 1 network')).toBeTruthy()
    })
  })
})
